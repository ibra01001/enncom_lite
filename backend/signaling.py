# pyrefly: ignore [missing-import]
from app import socketio
from flask_socketio import emit
import app

class Signaling:

    def __init__(self):
        self.rooms = {}

    @socketio.on('Signal')
    def handle_signal(data):
        room=data['room']
        emit('Signal', data, to=data['room'], include_self=False)


if __name__ == '__main__':
    socketio.run(app, debug=True,port=5001)

exports = Signaling()