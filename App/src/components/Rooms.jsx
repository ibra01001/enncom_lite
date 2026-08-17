import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

const COLORS = {
    bg: '#1e1e1e',
    secondary: '#656565',
    accent: '#FF3535',
};

const Rooms = ({ currentRoom = 'public', onSelectRoom }) => {
    const { socket } = useSocket();
    const [rooms, setRooms] = useState([{ id: 'public', name: 'Public Chat' }]);
    const [isCreating, setIsCreating] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [editingRoomId, setEditingRoomId] = useState(null);
    const [editingName, setEditingName] = useState('');

    useEffect(() => {
        if (!socket) return;

        socket.emit('get_my_rooms');

        const handleRoomsList = (data) => {
            if (data?.rooms && Array.isArray(data.rooms)) {
                setRooms(data.rooms);
            }
        };

        const handleRoomCreated = (data) => {
            if (data?.room) {
                const newRoomObj = { id: data.room, name: data.name || data.room };
                setRooms((prev) => {
                    const exists = prev.some((r) => r.id === data.room);
                    if (exists) return prev;
                    return [...prev, newRoomObj];
                });
                if (onSelectRoom) {
                    onSelectRoom(data.room);
                }
            }
        };

        const handleRoomUpdated = (data) => {
            if (data?.room && data?.name) {
                setRooms((prev) =>
                    prev.map((r) => (r.id === data.room ? { ...r, name: data.name } : r))
                );
            }
        };

        const handleRoomDeleted = (data) => {
            if (data?.room) {
                setRooms((prev) => prev.filter((r) => r.id !== data.room));
                if (currentRoom === data.room && onSelectRoom) {
                    onSelectRoom('public');
                }
            }
        };

        socket.on('rooms_list', handleRoomsList);
        socket.on('room_created', handleRoomCreated);
        socket.on('room_updated', handleRoomUpdated);
        socket.on('room_deleted', handleRoomDeleted);

        return () => {
            socket.off('rooms_list', handleRoomsList);
            socket.off('room_created', handleRoomCreated);
            socket.off('room_updated', handleRoomUpdated);
            socket.off('room_deleted', handleRoomDeleted);
        };
    }, [socket, currentRoom, onSelectRoom]);

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        if (!socket) return;
        socket.emit('create_room', { name: newRoomName.trim() });
        setNewRoomName('');
        setIsCreating(false);
    };

    const handleUpdateSubmit = (e, roomId) => {
        e.preventDefault();
        if (!socket || !editingName.trim()) return;
        socket.emit('update_room', { room: roomId, name: editingName.trim() });
        setEditingRoomId(null);
        setEditingName('');
    };

    const handleDelete = (e, roomId) => {
        e.stopPropagation();
        if (!socket) return;
        socket.emit('delete_room', { room: roomId });
    };

    const startEditing = (e, room) => {
        e.stopPropagation();
        setEditingRoomId(room.id);
        setEditingName(room.name);
    };

    return (
        <aside
            style={{ backgroundColor: COLORS.bg }}
            className="w-64 sm:w-72 lg:w-80 h-full shrink-0 border-r border-[#FF3535] flex flex-col p-4 md:p-6 select-none overflow-y-auto"
        >
            <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-zinc-800">
                <h2 className="text-xl font-bold text-white tracking-wide m-0">#Rooms</h2>
                <button
                    onClick={() => setIsCreating(!isCreating)}
                    style={{ backgroundColor: COLORS.accent }}
                    className="text-white text-xs font-semibold px-3 py-1.5 rounded-none hover:opacity-90 active:opacity-80 transition-opacity"
                >
                    {isCreating ? 'Cancel' : '+ Private Room'}
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreateSubmit} className="mb-4 flex flex-col gap-2 bg-[#252525] p-3 border border-zinc-800">
                    <input
                        type="text"
                        placeholder="Room name..."
                        value={newRoomName}
                        onChange={(e) => setNewRoomName(e.target.value)}
                        className="bg-[#1e1e1e] text-white text-xs p-2 border border-zinc-700 focus:outline-none focus:border-[#FF3535]"
                        autoFocus
                    />
                    <button
                        type="submit"
                        style={{ backgroundColor: COLORS.accent }}
                        className="text-white text-xs font-semibold py-1.5 hover:opacity-90 transition-opacity"
                    >
                        Create
                    </button>
                </form>
            )}

            <div className="flex flex-col gap-2">
                <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider text-left mb-1">
                    Current Rooms
                </p>

                {rooms.map((room) => {
                    const isActive = currentRoom === room.id;
                    const isEditing = editingRoomId === room.id;

                    if (isEditing) {
                        return (
                            <form
                                key={room.id}
                                onSubmit={(e) => handleUpdateSubmit(e, room.id)}
                                className="bg-[#2A2A2A] p-2 flex items-center gap-2 border border-zinc-700"
                            >
                                <input
                                    type="text"
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    className="bg-[#1e1e1e] text-white text-xs p-1.5 border border-zinc-700 focus:outline-none focus:border-[#FF3535] flex-1"
                                    autoFocus
                                />
                                <button
                                    type="submit"
                                    className="text-xs text-white bg-emerald-600 px-2 py-1 hover:bg-emerald-500 font-semibold"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingRoomId(null)}
                                    className="text-xs text-zinc-400 hover:text-white px-1 font-semibold"
                                >
                                    Cancel
                                </button>
                            </form>
                        );
                    }

                    return (
                        <div
                            key={room.id}
                            onClick={() => onSelectRoom && onSelectRoom(room.id)}
                            style={{ borderLeft: isActive ? `3px solid ${COLORS.accent}` : '3px solid transparent' }}
                            className={`${isActive ? 'bg-[#2A2A2A] text-white' : 'bg-transparent text-zinc-400 hover:text-white hover:bg-[#252525]'
                                } px-4 py-3 flex items-center justify-between font-semibold text-sm cursor-pointer transition-colors group`}
                        >
                            <span className="flex items-center gap-2 truncate">
                                <span style={{ color: COLORS.accent }}>#</span> {room.name}
                            </span>

                            <div className="flex items-center gap-2">
                                {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>}
                                {room.id !== 'public' && (
                                    <div className="hidden group-hover:flex items-center gap-2">
                                        <button
                                            onClick={(e) => startEditing(e, room)}
                                            title="Rename room"
                                            className="text-xs text-zinc-400 hover:text-white transition-colors"
                                        >
                                            edit
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(e, room.id)}
                                            title="Delete room"
                                            className="text-xs text-zinc-400 hover:text-[#FF3535] transition-colors"
                                        >
                                            del
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default Rooms;