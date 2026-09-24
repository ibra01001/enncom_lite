# Configuration for the backend
import os
import secrets
from pathlib import Path

# Automatically load .env if python-dotenv is installed
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / '.env'
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

# Server & Environment Settings
FLASK_ENV = os.getenv("FLASK_ENV", "production")
DEBUG = os.getenv("FLASK_DEBUG", "0").lower() in ("1", "true", "yes")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 5000))
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_hex(32))

# CORS Configuration
# Accepts "*" or comma-separated origins (e.g., "https://example.com,http://localhost:5173")
_raw_cors = os.getenv("CORS_ALLOWED_ORIGINS", "*").strip()
if _raw_cors == "*":
    CORS_ALLOWED_ORIGINS = "*"
else:
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _raw_cors.split(",") if origin.strip()]

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", None)
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None) or None
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_SSL = os.getenv("REDIS_SSL", "false").lower() in ("1", "true", "yes")

# Socket.IO Message Queue (used for multi-worker / multi-container scaling)
SOCKETIO_MESSAGE_QUEUE = os.getenv("SOCKETIO_MESSAGE_QUEUE", None)

# Application Constants & Limits
PUBLIC_CHAT_KEY = os.getenv("PUBLIC_CHAT_KEY", "chat:messages:public")
MAX_HISTORY = int(os.getenv("MAX_HISTORY", 50))
TTL_SECONDS = int(os.getenv("TTL_SECONDS", 86400))
MAX_MSG_BYTES = int(os.getenv("MAX_MSG_BYTES", 65536))       # 64 KB message payload limit
MAX_KEY_PACKAGES = int(os.getenv("MAX_KEY_PACKAGES", 50))   # Cap KeyPackage pool depth per user
MAX_COMMIT_HISTORY = int(os.getenv("MAX_COMMIT_HISTORY", 30)) # Retain last N commits per room for epoch catch-up
