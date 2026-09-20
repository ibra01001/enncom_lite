# pyrefly: ignore [missing-import]
import redis
from flask_socketio import SocketIO
from config import REDIS_HOST, REDIS_PORT

# Flask-SocketIO instance (initialized later with app)
socketio = SocketIO(cors_allowed_origins="*")

# Redis connection instance
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
