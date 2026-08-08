from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import time 
import redis
import json


app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}}) 
socketio = SocketIO(app, cors_allowed_origins="*") # ! we will change this later

# connect to redis 
r = redis.Redis(host="redis", port=6379, decode_responses=True)

MESSAGE_KEY = "chat:messages"  # append-only list (LRU) of all messages
MAX_HISTORY = 50
TTL_SECONDS = 86400
# Maps client_token → short_id (persists identity across reconnects ) 
token_to_id = {}



def get_or_create_id(client_token):
    """Derive a stable short ID from a client token.
    If the token was seen before, return the same ID."""
    if client_token and client_token in token_to_id:
        return token_to_id[client_token]
    # Use the client token directly (already 6 chars from the client)
    # or fall back to socket.id slice if no token provided
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

    history = r.lrange(MESSAGE_KEY, 0, MAX_HISTORY -1)
    message = [json.loads(m) for m in history] # newest first 
    emit(("initial history",message))


@socketio.on('disconnect')
def handle_disconnect():
    print(f'disconnected: {request.sid}')



@socketio.on('chat message')
def handle_message(msg):
    # ! Simulate server latency for testing
    time.sleep(2)
    client_token = request.args.get('client_token', None)
    sender_id = get_or_create_id(client_token)
    msg.pop('username', None)           # ignore any client-sent username
    msg['senderId'] = sender_id         # stamp with server identity
    # Pass through clientMsgId so the sender can reconcile optimistic UI
    print(f'[#{sender_id}] {msg["text"]}')

    # save to redis  
    r.lpush(MESSAGE_KEY, json.dumps(msg))  # append new message
    r.ltrim(MESSAGE_KEY, 0, MAX_HISTORY - 1)
    r.expire(MESSAGE_KEY, TTL_SECONDS)
    emit('chat message', msg, broadcast=True, include_self=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
