import os

# Server & Redis Configuration
REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

# Application Constants
PUBLIC_CHAT_KEY = "chat:messages:public"
MAX_HISTORY = 50
TTL_SECONDS = 86400
MAX_MSG_BYTES = 65536     # 64 KB message payload limit
MAX_KEY_PACKAGES = 50     # Cap KeyPackage pool depth per user
MAX_COMMIT_HISTORY = 30   # Retain last 30 commits per room for automatic epoch catch-up
