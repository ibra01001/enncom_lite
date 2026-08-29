import { useState, useEffect, type FC, type FormEvent, type MouseEvent } from 'react';
import { useSocket } from '../context/SocketContext';
import type {
  Room,
  RoomsListPayload,
  RoomCreatedPayload,
  RoomUpdatedPayload,
  RoomDeletedPayload,
} from '../types/chat';
import { useMls } from '../context/MlsContext';


const COLORS = {
  bg: '#1e1e1e',
  secondary: '#656565',
  accent: '#FF3535',
};

interface RoomsProps {
  currentRoom?: string;
  onSelectRoom?: (roomId: string) => void;
}

const Rooms: FC<RoomsProps> = ({ currentRoom = 'public', onSelectRoom }) => {
  const { socket } = useSocket();
  const { createGroup } = useMls();
  const [rooms, setRooms] = useState<Room[]>([{ id: 'public', name: 'Public Chat' }]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newRoomName, setNewRoomName] = useState<string>('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  useEffect(() => {
    if (!socket) return;

    socket.emit('get_my_rooms');

    const handleRoomsList = (data: RoomsListPayload) => {
      if (data?.rooms && Array.isArray(data.rooms)) {
        setRooms(data.rooms);
      }
    };

    const handleRoomCreated = (data: RoomCreatedPayload) => {
      if (data?.room) {
        createGroup(data.room);
        const newRoomObj: Room = { id: data.room, name: data.name || data.room };
        setRooms((prev) => {
          const exists = prev.some((r) => r.id === data.room);
          if (exists) return prev;
          return [...prev, newRoomObj];
        });
        // Copy invite link to clipboard automatically
        const inviteUrl = `${window.location.origin}/chatbox?room=${data.room}`;
        navigator.clipboard.writeText(inviteUrl).catch(() => { });
        if (onSelectRoom) {
          onSelectRoom(data.room);
        }
      }
    };

    const handleRoomUpdated = (data: RoomUpdatedPayload) => {
      if (data?.room && data?.name) {
        setRooms((prev) =>
          prev.map((r) => (r.id === data.room ? { ...r, name: data.name } : r))
        );
      }
    };

    const handleRoomDeleted = (data: RoomDeletedPayload) => {
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

  const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket) return;
    socket.emit('create_room', { name: newRoomName.trim() });
    setNewRoomName('');
    setIsCreating(false);
  };

  const handleUpdateSubmit = (e: FormEvent<HTMLFormElement>, roomId: string) => {
    e.preventDefault();
    if (!socket || !editingName.trim()) return;
    socket.emit('update_room', { room: roomId, name: editingName.trim() });
    setEditingRoomId(null);
    setEditingName('');
  };

  const handleDelete = (e: MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!socket) return;
    socket.emit('delete_room', { room: roomId });
  };

  const startEditing = (e: MouseEvent, room: Room) => {
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
          className="text-white text-xs font-semibold px-3 py-1.5 rounded-none hover:opacity-90 active:opacity-80 transition-opacity cursor-pointer"
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
            className="text-white text-xs font-semibold py-1.5 hover:opacity-90 transition-opacity cursor-pointer"
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
                  className="text-xs text-white bg-emerald-600 px-2 py-1 hover:bg-emerald-500 font-semibold cursor-pointer"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoomId(null)}
                  className="text-xs text-zinc-400 hover:text-white px-1 font-semibold cursor-pointer"
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
                      className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const url = `${window.location.origin}/chatbox?room=${room.id}`;
                        navigator.clipboard.writeText(url).catch(() => { });
                      }}
                      title="Copy invite link"
                      className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      link
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, room.id)}
                      title="Delete room"
                      className="text-xs text-zinc-400 hover:text-[#FF3535] transition-colors cursor-pointer"
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
