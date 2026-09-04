# pyrefly: ignore [missing-import]
from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room as flask_join_room, leave_room as flask_leave_room
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
MAX_MSG_BYTES = 65536     # 64 KB message payload limit
MAX_KEY_PACKAGES = 50     # Cap KeyPackage pool depth per user

def get_or_create_id(client_token):
    """Derive a stable short ID from a client token.
    Persisted in Redis so identity survives server restarts."""
    if not client_token:
        return request.sid[:6]
    sanitized_token = str(client_token)[:64]
    cached = r.get(f"token:{sanitized_token}:id")
    if cached:
        return cached
    short_id = sanitized_token[:6]
    r.set(f"token:{sanitized_token}:id", short_id, ex=TTL_SECONDS)
    return short_id

def get_current_user_id():
    """Extract persistent short ID for current request socket."""
    client_token = request.args.get('client_token', None)
    return get_or_create_id(client_token)

# ============================================================================
# Connection Lifecycle
# ============================================================================

@socketio.on('connect')
def handle_connect():
    user_id = get_current_user_id()
    # Native Socket.IO user room: enables clean cluster-ready targeted emissions
    flask_join_room(f"user:{user_id}")
    print(f'connected: {request.sid} (#{user_id})')
    
    # Single source of truth: server tells client its assigned ID
    emit('session_info', {'myId': user_id})

@socketio.on('disconnect')
def handle_disconnect():
    user_id = get_current_user_id()
    print(f'disconnected: {request.sid} (#{user_id})')

# ============================================================================
# Room Management (High Performance & Strict Permissions)
# ============================================================================

@socketio.on('create_room')
def create_room(data=None):
    user_id = get_current_user_id()
    raw_name = data.get('name') if isinstance(data, dict) else None
    
    room_id = uuid.uuid4().hex[:8]
    room_name = f"room_{room_id}"
    display_name = raw_name.strip()[:64] if raw_name and raw_name.strip() else f"Private Room #{room_id[:4]}"

    # Atomic pipeline execution
    pipe = r.pipeline()
    # 1. Room metadata with MLS binding
    pipe.hset(f"chat:room:{room_name}", mapping={
        "name": display_name,
        "owner": user_id,
        "created_at": time.time(),
        "mls_enabled": "1"
    })
    # 2. Add room to creator's personal room set
    pipe.sadd(f"user:{user_id}:rooms", room_name)
    # 3. Initialize room epoch counter
    pipe.set(f"room:{room_name}:epoch", "0")
    # 4. Initialize room message history
    room_key = f"chat:messages:{room_name}"
    pipe.lpush(room_key, json.dumps({
        "room": room_name,
        "senderId": "system",
        "text": f"Room '{display_name}' created.",
        "timestamp": time.time()
    }))
    pipe.expire(room_key, TTL_SECONDS)
    pipe.execute()

    # Automatically join creator to socket room
    flask_join_room(room_name)

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
    private_rooms = [rm for rm in user_rooms if rm != 'public']
    
    # Always include Public Chat as first item
    rooms_info = [{
        "id": "public",
        "name": "Public Chat",
        "owner": "system",
        "mls_enabled": False
    }]
    
    if private_rooms:
        # High-Performance: Batch all room metadata in 1 single network roundtrip
        pipe = r.pipeline()
        for room_id in private_rooms:
            pipe.hgetall(f"chat:room:{room_id}")
        metas = pipe.execute()

        stale_rooms = []
        parsed_rooms = []
        for room_id, meta in zip(private_rooms, metas):
            if not meta:
                # Ghost room found: schedule auto-pruning
                stale_rooms.append(room_id)
                continue
            parsed_rooms.append({
                "id": room_id,
                "name": meta.get("name", room_id),
                "owner": meta.get("owner"),
                "mls_enabled": meta.get("mls_enabled") == "1",
                "created_at": float(meta.get("created_at", 0))
            })

        # Auto-prune deleted/ghost rooms from Redis
        if stale_rooms:
            r.srem(f"user:{user_id}:rooms", *stale_rooms)

        # Sort private rooms deterministically by creation time (newest first)
        parsed_rooms.sort(key=lambda x: x["created_at"], reverse=True)
        rooms_info.extend(parsed_rooms)
            
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

    # Safety: Only the room owner can rename
    room_meta = r.hgetall(f"chat:room:{room}")
    if room_meta and room_meta.get("owner") == user_id:
        sanitized_name = new_name.strip()[:64]
        r.hset(f"chat:room:{room}", "name", sanitized_name)
        emit('room_updated', {'room': room, 'name': sanitized_name}, to=room, include_self=True)

@socketio.on('delete_room')
def delete_room(data):
    room = data.get('room') if isinstance(data, dict) else data
    if not room or room == 'public':
        return
        
    user_id = get_current_user_id()
    room_meta = r.hgetall(f"chat:room:{room}")
    if not room_meta:
        return

    is_owner = (room_meta.get("owner") == user_id)

    if is_owner:
        # Owner deletes: purge messages, room metadata, and epoch state
        pipe = r.pipeline()
        pipe.delete(f"chat:messages:{room}")
        pipe.delete(f"chat:room:{room}")
        pipe.delete(f"room:{room}:epoch")
        pipe.srem(f"user:{user_id}:rooms", room)
        pipe.execute()

        # Broadcast deletion and MLS destruction to all sockets in the room
        emit('room_deleted', {'room': room}, to=room, include_self=True)
        emit('mls_group_destroyed', {'room': room}, to=room, include_self=True)
    else:
        # Guest deletes: treats as Leave Room (does not destroy room for others)
        r.srem(f"user:{user_id}:rooms", room)
        flask_leave_room(room)
        emit('peer_left', {'peerId': user_id, 'room': room}, to=room, include_self=False)
        emit('room_deleted', {'room': room})  # Signal only calling client to remove from sidebar

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

        # Persist membership so guest retains access after refresh/reconnect
        r.sadd(f"user:{user_id}:rooms", room)

    flask_join_room(room)
    print(f'Client {request.sid} (#{user_id}) joined room "{room}"')
    
    # Notify existing room members so they can initiate MLS welcome exchange
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

# ============================================================================
# Messaging (E2EE Safety & Validation)
# ============================================================================

@socketio.on('chat message')
def handle_message(msg):
    if not isinstance(msg, dict):
        return
    sender_id = get_current_user_id()
    room = msg.get('room', 'public')

    # Safety: Payload size limit
    raw_payload = json.dumps(msg)
    if len(raw_payload.encode('utf-8')) > MAX_MSG_BYTES:
        emit('message_error', {'error': 'Payload size exceeds limit'})
        return

    # Safety: Verify E2EE enforcement in private rooms
    if room != 'public':
        room_meta = r.hgetall(f"chat:room:{room}")
        if room_meta.get("mls_enabled") == "1" and not msg.get('ciphertext'):
            emit('message_error', {'error': 'Encrypted ciphertext required for this room'})
            return

    msg.pop('username', None)           # ignore any client-sent username
    msg['senderId'] = sender_id         # stamp with server identity
    msg['room'] = room
    log_content = msg.get('text') or '[encrypted payload]'
    print(f'[{room}][#{sender_id}] {log_content}')

    # Save to Redis in a single atomic pipeline
    room_key = f"chat:messages:{room}"
    try:
        msg_to_store = {k: v for k, v in msg.items() if k != 'clientMsgId'}
        pipe = r.pipeline()
        pipe.lpush(room_key, json.dumps(msg_to_store))  # prepend new message
        pipe.ltrim(room_key, 0, MAX_HISTORY - 1)
        pipe.expire(room_key, TTL_SECONDS)
        pipe.execute()
    except Exception as e:
        print(f"Error saving message to Redis: {e}")

    # Emit message to all clients in the room
    emit('chat message', msg, to=room, include_self=True)

# ============================================================================
# MLS E2EE Socket Handlers
# ============================================================================

@socketio.on('publish_key_packages')
def handle_publish_key_packages(data):
    user_id = get_current_user_id()
    if not isinstance(data, dict):
        return
    key_packages = data.get('keyPackages', [])
    if key_packages:
        packages_to_add = key_packages[:MAX_KEY_PACKAGES]
        key = f"user:{user_id}:keypackages"
        pipe = r.pipeline()
        pipe.rpush(key, *packages_to_add)
        pipe.ltrim(key, -MAX_KEY_PACKAGES, -1)  # Keep pool capped
        pipe.expire(key, TTL_SECONDS)
        pipe.execute()
        print(f"Registered pool of {len(packages_to_add)} key package(s) for user #{user_id}")

@socketio.on('publish_key_package')
def handle_publish_key(data):
    user_id = get_current_user_id()
    if not isinstance(data, dict):
        return
    key_package_b64 = data.get('keyPackage')
    if key_package_b64:
        key = f"user:{user_id}:keypackages"
        pipe = r.pipeline()
        pipe.rpush(key, key_package_b64)
        pipe.ltrim(key, -MAX_KEY_PACKAGES, -1)
        pipe.expire(key, TTL_SECONDS)
        pipe.execute()
        print(f"Key package registered for user #{user_id}")

@socketio.on('get_key_package')
def handle_get_key(data):
    if not isinstance(data, dict):
        return
    target_user_id = data.get('userId')
    room_id = data.get('roomId')
    # Pop one KeyPackage from the pool (MLS consume-once semantics)
    key_package_b64 = r.lpop(f"user:{target_user_id}:keypackages")
    # Fallback to single keypackage key if legacy exists
    if not key_package_b64:
        key_package_b64 = r.get(f"user:{target_user_id}:keypackage")
    emit('key_package_response', {
        'userId': target_user_id,
        'roomId': room_id,
        'keyPackage': key_package_b64
    })

@socketio.on('request_mls_welcome')
def handle_request_welcome(data):
    if not isinstance(data, dict):
        return
    room = data.get('roomId')
    user_id = get_current_user_id()
    if room and room != 'public':
        emit('peer_needs_welcome', {'peerId': user_id, 'room': room}, to=room, include_self=False)

@socketio.on('send_welcome')
def handle_send_welcome(data):
    if not isinstance(data, dict):
        return
    target_user_id = data.get('targetUserId')
    if not target_user_id:
        return
    # Targeted delivery using native Socket.IO user room
    emit('mls_welcome', data, to=f"user:{target_user_id}")
    print(f"Targeted MLS welcome delivered to user #{target_user_id}")

@socketio.on('send_commit')
def handle_send_commit(data):
    if not isinstance(data, dict):
        return
    room = data.get('roomId')
    if not room or room == 'public':
        return

    expected_epoch = data.get('epoch')
    current_epoch_str = r.get(f"room:{room}:epoch")
    current_epoch = int(current_epoch_str) if current_epoch_str is not None else 0

    if expected_epoch is not None:
        try:
            if int(expected_epoch) != current_epoch:
                emit('epoch_conflict', {
                    'roomId': room,
                    'serverEpoch': current_epoch,
                    'attemptedEpoch': int(expected_epoch)
                })
                print(f"Epoch conflict in {room}: client attempted {expected_epoch}, server at {current_epoch}")
                return
        except (ValueError, TypeError):
            pass

    new_epoch = r.incr(f"room:{room}:epoch")
    r.expire(f"room:{room}:epoch", TTL_SECONDS)
    data['epoch'] = new_epoch
    # Broadcast commit to all other room members so their RatchetTree stays synchronized
    emit('mls_commit', data, to=room, include_self=False)
    print(f"Commit accepted for room {room}: epoch {current_epoch} -> {new_epoch}")

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
