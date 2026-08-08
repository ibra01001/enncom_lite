from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    short_id = request.sid[:6]
    print(f'connected: {request.sid} (#{short_id})')
    # Single source of truth: server tells the client its ID
    emit('session_info', {'myId': short_id})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'disconnected: {request.sid}')

@socketio.on('chat message')
def handle_message(msg):
    sender_id = request.sid[:6]
    msg.pop('username', None)       # ignore any client-sent username
    msg['senderId'] = sender_id     # stamp with server identity
    print(f'[#{sender_id}] {msg["text"]}')
    emit('chat message', msg, broadcast=True, include_self=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
