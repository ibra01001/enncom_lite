from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os
import time 
app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Maps client_token → short_id (persists identity across reconnects)
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

@socketio.on('disconnect')
def handle_disconnect():
    print(f'disconnected: {request.sid}')

@socketio.on('chat message')
def handle_message(msg):
    # Simulate server latency
    time.sleep(2)
    client_token = request.args.get('client_token', None)
    sender_id = get_or_create_id(client_token)
    msg.pop('username', None)           # ignore any client-sent username
    msg['senderId'] = sender_id         # stamp with server identity
    # Pass through clientMsgId so the sender can reconcile optimistic UI
    print(f'[#{sender_id}] {msg["text"]}')
    emit('chat message', msg, broadcast=True, include_self=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
