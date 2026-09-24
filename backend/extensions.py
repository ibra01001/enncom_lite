# Extensions like Redis and Flask-SocketIO

# pyrefly: ignore [missing-import]

import redis

from flask_socketio import SocketIO

from config import (
    REDIS_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_PASSWORD,
    REDIS_DB,
    REDIS_SSL,
    CORS_ALLOWED_ORIGINS,
    SOCKETIO_MESSAGE_QUEUE,
)


# ============================================================
# Flask-SocketIO
# ============================================================

socketio_kwargs = {
    "cors_allowed_origins": CORS_ALLOWED_ORIGINS,
}

# Only enable a Redis Socket.IO message queue when explicitly
# configured. This is useful when running multiple workers.
if SOCKETIO_MESSAGE_QUEUE:
    socketio_kwargs["message_queue"] = SOCKETIO_MESSAGE_QUEUE


socketio = SocketIO(
    **socketio_kwargs
)


# ============================================================
# Redis
# ============================================================

if REDIS_URL:
    # Production / hosted Redis
    #
    # Example:
    # rediss://default:PASSWORD@HOST:PORT
    r = redis.from_url(
        REDIS_URL,
        decode_responses=True,
    )

else:
    # Local Docker Redis
    r = redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        password=REDIS_PASSWORD,
        db=REDIS_DB,
        ssl=REDIS_SSL,
        decode_responses=True,
    )