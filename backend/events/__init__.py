def register_events():
    """Import all socket event handlers to bind them to the SocketIO instance."""
    from . import connection
    from . import rooms
    from . import chat
    from . import mls
