# pyrefly: ignore [missing-import]
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room as flask_join_room
from flask_cors import CORS
import os
import time 
# pyrefly: ignore [missing-import]
import redis
import json
import uuid

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}}) 
socketio = SocketIO(app, cors_allowed_origins="*")

# Connect to Redis
r = redis.Redis(host="redis", port=6379, decode_responses=True)
PUBLIC_CHAT_KEY = "chat:messages:public"
MAX_HISTORY = 50
TTL_SECONDS = 86400

# Maps client_token → short_id (persists identity across reconnects) 
token_to_id = {}

def get_or_create_id(client_token):
    """Derive a stable short ID from a client token.
    If the token was seen before, return the same ID."""
    if client_token and client_token in token_to_id:
        return token_to_id[client_token]
    short_id = client_token[:6] if client_token else request.sid[:6]
    if client_token:
        token_to_id[client_token] = short_id
    return short_id

def get_current_user_id():
    """Extract persistent short ID for current request socket."""
    client_token = request.args.get('client_token', None)
    return get_or_create_id(client_token)

# Room Data Schema:
# chat:room:<room_id>      -> Hash { name, owner, created_at }
# chat:messages:<room_id>  -> List of JSON messages
# user:<user_id>:rooms     -> Set of joined room IDs

@socketio.on('create_room')
def create_room(data=None):
    user_id = get_current_user_id()
    custom_name = data.get('name') if isinstance(data, dict) else None
    
    room_id = uuid.uuid4().hex[:8]
    room_name = f"room_{room_id}"
    display_name = custom_name.strip() if custom_name and custom_name.strip() else f"Private Room #{room_id[:4]}"

    # Save room metadata in Redis
    r.hset(f"chat:room:{room_name}", mapping={
        "name": display_name,
        "owner": user_id,
        "created_at": time.time()
    })

    # Add room to creator's personal room set
    r.sadd(f"user:{user_id}:rooms", room_name)

    # Automatically join creator to socket room
    flask_join_room(room_name)

    # Initialize room message history
    room_key = f"chat:messages:{room_name}"
    r.lpush(room_key, json.dumps({
        "room": room_name,
        "senderId": "system",
        "text": f"Room '{display_name}' created.",
        "timestamp": time.time()
    }))
    r.expire(room_key, TTL_SECONDS)

    emit('room_created', {
        'room': room_name,
        'name': display_name,
        'owner': user_id
    })
    return room_name

@socketio.on('get_my_rooms')
def get_my_rooms():
    user_id = get_current_user_id()
    user_rooms = r.smembers(f"user:{user_id}:rooms") or set()
    user_rooms.add("public")
    
    rooms_info = []
    for room_id in user_rooms:
        if room_id == 'public':
            rooms_info.append({"id": "public", "name": "Public Chat"})
        else:
            room_meta = r.hgetall(f"chat:room:{room_id}")
            display_name = room_meta.get("name", room_id) if room_meta else room_id
            rooms_info.append({"id": room_id, "name": display_name})
            
    emit('rooms_list', {'rooms': rooms_info})

@socketio.on('update_room')
def update_room(data):
    if not isinstance(data, dict):
        return
    user_id = get_current_user_id()
    room = data.get('room')
    new_name = data.get('name')
    
    if not room or room == 'public' or not new_name:
        return

    # Verify user membership/ownership
    if room in r.smembers(f"user:{user_id}:rooms"):
        r.hset(f"chat:room:{room}", "name", new_name.strip())
        emit('room_updated', {'room': room, 'name': new_name.strip()}, to=room, include_self=True)

@socketio.on('delete_room')
def delete_room(data):
    room = data.get('room') if isinstance(data, dict) else data
    if not room or room == 'public':
        return
        
    user_id = get_current_user_id()
    
    if room in r.smembers(f"user:{user_id}:rooms"):
        # Delete message history and metadata
        r.delete(f"chat:messages:{room}")
        r.delete(f"chat:room:{room}")
        
        # Remove room from user's joined rooms set
        r.srem(f"user:{user_id}:rooms", room)
        
        # Broadcast deletion to all sockets in the room
        emit('room_deleted', {'room': room}, to=room, include_self=True)

@socketio.on('connect')
def handle_connect():
    client_token = request.args.get('client_token', None)
    short_id = get_or_create_id(client_token)
    print(f'connected: {request.sid} (#{short_id})')
    
    # Single source of truth: server tells the client its assigned ID
    emit('session_info', {'myId': short_id})

@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room', 'public') if isinstance(data, dict) else 'public'
    user_id = get_current_user_id()

    # Validate private room exists in Redis before allowing join
    if room != 'public':
        room_meta = r.hgetall(f"chat:room:{room}")
        if not room_meta:
            emit('join_error', {'room': room, 'message': 'Room not found or has been deleted.'})
            return

        # Persist membership so the guest keeps access after refresh/reconnect
        r.sadd(f"user:{user_id}:rooms", room)

    flask_join_room(room)
    print(f'Client {request.sid} (#{user_id}) joined room "{room}"')
    
    # Notify existing room members that a new peer joined so they can initiate MLS welcome exchange
    if room != 'public':
        emit('peer_joined', {'peerId': user_id, 'room': room}, to=room, include_self=False)

    room_key = f"chat:messages:{room}"
    try:
        raw_history = r.lrange(room_key, 0, MAX_HISTORY - 1)
        # Fallback for legacy key if public room key is empty
        if not raw_history and room == 'public':
            raw_history = r.lrange("chat:messages", 0, MAX_HISTORY - 1)
        history = [json.loads(m) for m in reversed(raw_history)]
        emit('initial history', {'room': room, 'history': history})
    except Exception as e:
        print(f"Error fetching history for room '{room}': {e}")
        emit('initial history', {'room': room, 'history': []})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'disconnected: {request.sid}')

@socketio.on('chat message')
def handle_message(msg):
    client_token = request.args.get('client_token', None)
    sender_id = get_or_create_id(client_token)
    room = msg.get('room', 'public')

    msg.pop('username', None)           # ignore any client-sent username
    msg['senderId'] = sender_id         # stamp with server identity
    msg['room'] = room
    log_content = msg.get('text') or '[encrypted payload]'
    print(f'[{room}][#{sender_id}] {log_content}')

    # Save to Redis under room-specific key
    room_key = f"chat:messages:{room}"
    try:
        msg_to_store = {k: v for k, v in msg.items() if k != 'clientMsgId'}
        r.lpush(room_key, json.dumps(msg_to_store))  # prepend new message
        r.ltrim(room_key, 0, MAX_HISTORY - 1)
        r.expire(room_key, TTL_SECONDS)
    except Exception as e:
        print(f"Error saving message to Redis: {e}")

    # Emit message to all clients in the room
    emit('chat message', msg, to=room, include_self=True)

# ============================================================================
# MLS E2EE Socket Handlers
# ============================================================================

@socketio.on('publish_key_package')
def handle_publish_key(data):
    user_id = get_current_user_id()
    key_package_b64 = data.get('keyPackage') if isinstance(data, dict) else None
    if key_package_b64:
        r.set(f"user:{user_id}:keypackage", key_package_b64, ex=TTL_SECONDS)
        print(f"Key package registered for user #{user_id}")

@socketio.on('get_key_package')
def handle_get_key(data):
    if not isinstance(data, dict):
        return
    target_user_id = data.get('userId')
    room_id = data.get('roomId')
    key_package_b64 = r.get(f"user:{target_user_id}:keypackage")
    emit('key_package_response', {
        'userId': target_user_id,
        'roomId': room_id,
        'keyPackage': key_package_b64
    })

@socketio.on('send_welcome')
def handle_send_welcome(data):
    if not isinstance(data, dict):
        return
    room = data.get('roomId')
    # Broadcast welcome packet so the target user receives it
    emit('mls_welcome', data, to=room, include_self=False)

@socketio.on('send_commit')
def handle_send_commit(data):
    if not isinstance(data, dict):
        return
    room = data.get('roomId')
    # Broadcast commit to all other room members so their RatchetTree stays synchronized
    emit('mls_commit', data, to=room, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
