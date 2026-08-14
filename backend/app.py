from flask import Flask, request
from flask_socketio import SocketIO, emit, join_room as flask_join_room
from flask_cors import CORS
import os
import time 
import redis
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}}) 
socketio = SocketIO(app, cors_allowed_origins="*")

# Connect to Redis
r = redis.Redis(host="redis", port=6379, decode_responses=True)

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
    flask_join_room(room)
    print(f'Client {request.sid} joined room "{room}"')
    
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
    print(f'[{room}][#{sender_id}] {msg["text"]}')

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

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
