# mls  related websocket events

from flask_socketio import emit
from extensions import socketio
from services.auth_service import get_current_user_id
import services.mls_service as mls_service
import services.room_service as room_service

@socketio.on('publish_key_packages')
def handle_publish_key_packages(data):
    user_id = get_current_user_id()
    if not isinstance(data, dict):
        return
    key_packages = data.get('keyPackages', [])
    if key_packages:
        count = mls_service.save_key_packages(user_id, key_packages)
        print(f"Registered fresh pool of {count} key package(s) for user #{user_id}")
        emit('key_package_count', {'count': count})

@socketio.on('get_key_package_count')
def handle_get_key_package_count():
    user_id = get_current_user_id()
    count = mls_service.get_key_package_count(user_id)
    emit('key_package_count', {'count': count})

@socketio.on('publish_key_package')
def handle_publish_key(data):
    user_id = get_current_user_id()
    if not isinstance(data, dict):
        return
    key_package_b64 = data.get('keyPackage')
    if key_package_b64:
        mls_service.append_key_package(user_id, key_package_b64)
        print(f"Key package registered for user #{user_id}")

@socketio.on('get_key_package')
def handle_get_key(data):
    if not isinstance(data, dict):
        return
    target_user_id = data.get('userId')
    room_id = data.get('roomId')
    key_package_b64 = mls_service.pop_key_package(target_user_id)
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
        room_meta = room_service.get_room_metadata(room)
        room_owner = room_meta.get('owner') if room_meta else None
        active_peers = room_service.get_active_peers(room)
        designated = mls_service.resolve_designated_inviter(user_id, room_owner, active_peers)

        emit('peer_needs_welcome', {
            'peerId': user_id,
            'room': room,
            'owner': room_owner,
            'designated_inviter': designated
        }, to=room, include_self=False)

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
        return {'success': False, 'error': 'invalid_payload'}
    room = data.get('roomId')
    if not room or room == 'public':
        return {'success': False, 'error': 'invalid_room'}

    expected_epoch = data.get('epoch')
    success, error, cur_epoch, new_epoch = mls_service.advance_epoch_and_store_commit(room, expected_epoch, data)

    if not success and error == 'epoch_conflict':
        emit('epoch_conflict', {
            'roomId': room,
            'serverEpoch': cur_epoch,
            'attemptedEpoch': int(expected_epoch) if expected_epoch is not None else 0
        })
        print(f"Epoch conflict in {room}: client attempted {expected_epoch}, server at {cur_epoch}")
        return {'success': False, 'error': 'epoch_conflict', 'serverEpoch': cur_epoch}

    data['epoch'] = new_epoch
    # Broadcast commit (and proposal if present) to all other room members
    emit('mls_commit', data, to=room, include_self=False)
    print(f"Commit accepted for room {room}: epoch {cur_epoch} -> {new_epoch}")
    return {'success': True, 'epoch': new_epoch}

@socketio.on('get_missed_commits')
def handle_get_missed_commits(data):
    if not isinstance(data, dict):
        return
    room = data.get('roomId')
    if not room or room == 'public':
        return
    
    user_id = get_current_user_id()
    try:
        from_epoch = int(data.get('fromEpoch', 0))
    except (ValueError, TypeError):
        from_epoch = 0

    missed, current_epoch = mls_service.get_missed_commits(room, user_id, from_epoch)
    if missed is None:
        return

    emit('missed_commits_response', {
        'roomId': room,
        'commits': missed,
        'latestEpoch': current_epoch
    })
    print(f"Delivered {len(missed)} missed commit(s) for room {room} to user #{user_id} (requested from {from_epoch}, latest {current_epoch})")
