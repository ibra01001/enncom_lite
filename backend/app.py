# main app that starts the backend 

import os
# pyrefly: ignore [missing-import]
from flask import Flask, jsonify
from flask_cors import CORS
from extensions import socketio, r
from events import register_events
from config import SECRET_KEY, CORS_ALLOWED_ORIGINS, DEBUG, HOST, PORT

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Configure CORS for REST endpoints
    CORS(app, resources={r"/*": {"origins": CORS_ALLOWED_ORIGINS}})
    
    # Health check endpoint for deployment probes / orchestrators
    @app.route('/health', methods=['GET'])
    def health():
        redis_ok = False
        try:
            redis_ok = bool(r.ping())
        except Exception as e:
            app.logger.warning(f"Healthcheck Redis ping failed: {e}")

        status = "healthy" if redis_ok else "degraded"
        status_code = 200 if redis_ok else 503
        return jsonify({
            "status": status,
            "redis": "connected" if redis_ok else "disconnected"
        }), status_code

    # Initialize SocketIO with Flask app
    socketio.init_app(app)
    
    # Register all Socket.IO event handlers
    register_events()
    
    return app

app = create_app()

if __name__ == '__main__':
    socketio.run(
        app,
        host=HOST,
        port=PORT,
        debug=DEBUG,
        allow_unsafe_werkzeug=DEBUG
    )
