from flask_socketio import emit
from extensions import socketio
from services.auth_service import get_current_user_id
import services.room_service as room_service
import services.chat_service as chat_service

@socketio.on('chat message')
def handle_message(msg):
    if not isinstance(msg, dict):
        return
    sender_id = get_current_user_id()
    room = msg.get('room', 'public')

    # Validate message
    room_meta = room_service.get_room_metadata(room)
    is_valid, err_msg = chat_service.validate_message_payload(msg, room_meta)
    if not is_valid:
        emit('message_error', {'error': err_msg})
        return

    msg.pop('username', None)           # ignore any client-sent username
    msg['senderId'] = sender_id         # stamp with server identity
    msg['room'] = room
    log_content = msg.get('text') or '[encrypted payload]'
    print(f'[{room}][#{sender_id}] {log_content}')

    # Save to Redis
    chat_service.save_message(msg)

    # Emit message to all clients in the room
    emit('chat message', msg, to=room, include_self=True)
