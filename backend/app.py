import os
# pyrefly: ignore [missing-import]
from flask import Flask
from flask_cors import CORS
from extensions import socketio
from events import register_events

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.urandom(24)
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize SocketIO with Flask app
    socketio.init_app(app)
    
    # Register all Socket.IO event handlers
    register_events()
    
    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
