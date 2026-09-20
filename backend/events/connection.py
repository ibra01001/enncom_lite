# connection events

# pyrefly: ignore [missing-import]
from flask import request
from flask_socketio import emit, join_room as flask_join_room
from extensions import socketio
from services.auth_service import get_current_user_id
from services.room_service import remove_user_from_active_rooms

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
    user_rooms = remove_user_from_active_rooms(user_id)
    for rm in user_rooms:
        emit('peer_left', {'peerId': user_id, 'room': rm}, to=rm, include_self=False)
