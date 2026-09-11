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
import '../styles/features.css';

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
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

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
  }, [socket, currentRoom, onSelectRoom, createGroup]);

  const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!socket || !newRoomName.trim()) return;
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

  const handleCopyLink = (e: MouseEvent, roomId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/chatbox?room=${roomId}`;
    navigator.clipboard.writeText(url).catch(() => { });
    setCopiedRoomId(roomId);
    setTimeout(() => setCopiedRoomId(null), 1800);
  };

  return (
    <aside className="w-68 sm:w-76 lg:w-80 h-full shrink-0 bg-[#181818] border-r border-[#333333] flex flex-col p-4 md:p-5 select-none overflow-y-auto">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 pb-4 mb-3 border-b border-[#333333]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ff3535] text-[18px]">forum</span>
          <h2 className="text-base font-bold text-white tracking-tight font-['Hanken_Grotesk',sans-serif] m-0">
            Sessions
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="ob-btn-accent text-[11px] py-1.5 px-2.5 font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"
          title="Create a new end-to-end encrypted private session"
        >
          <span className="material-symbols-outlined text-[14px]">
            {isCreating ? 'close' : 'add'}
          </span>
          <span>{isCreating ? 'Cancel' : 'New Room'}</span>
        </button>
      </div>

      {/* Inline Room Creation Form */}
      {isCreating && (
        <form
          onSubmit={handleCreateSubmit}
          className="mb-4 flex flex-col gap-2.5 bg-[#202020] p-3 rounded border border-[#333333] shadow-md animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between">
            <span className="ob-mono text-[10px] font-bold uppercase tracking-wider text-[#ff3535]">
              Create E2EE Room
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">RFC 9420</span>
          </div>
          <input
            type="text"
            placeholder="Room display name..."
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
            className="bg-[#121212] text-white text-xs px-3 py-2 rounded border border-[#333333] focus:border-[#ff3535] focus:outline-none placeholder-zinc-500 font-sans"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!newRoomName.trim()}
              className="ob-btn-accent text-xs py-1.5 px-3 flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Launch Group
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1.5 bg-[#181818] border border-[#333333] rounded hover:border-zinc-500 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Rooms List Section */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="ob-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            Active Channels
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">{rooms.length}</span>
        </div>

        {rooms.map((room) => {
          const isActive = currentRoom === room.id;
          const isEditing = editingRoomId === room.id;
          const isPublic = room.id === 'public';
          const isCopied = copiedRoomId === room.id;

          if (isEditing) {
            return (
              <form
                key={room.id}
                onSubmit={(e) => handleUpdateSubmit(e, room.id)}
                className="bg-[#222222] p-2 rounded flex items-center gap-2 border border-[#ff3535] shadow-sm"
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="bg-[#121212] text-white text-xs p-1.5 rounded border border-[#333333] focus:border-[#ff3535] focus:outline-none flex-1 font-sans"
                  autoFocus
                />
                <button
                  type="submit"
                  className="text-xs text-white bg-[#10b981] hover:bg-[#059669] px-2 py-1 rounded font-semibold cursor-pointer transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRoomId(null)}
                  className="text-xs text-zinc-400 hover:text-white px-1.5 font-semibold cursor-pointer"
                >
                  ✕
                </button>
              </form>
            );
          }

          return (
            <div
              key={room.id}
              onClick={() => onSelectRoom && onSelectRoom(room.id)}
              className={`px-3 py-2.5 rounded flex items-center justify-between text-xs font-semibold cursor-pointer transition-all group ${isActive
                ? 'bg-[#222222] text-white border-l-2 border-[#ff3535] border-y border-r border-[#333333] shadow-sm'
                : 'bg-transparent text-zinc-300 hover:text-white hover:bg-[#1f1f1f] border-l-2 border-transparent'
                }`}
            >
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span
                  className={`material-symbols-outlined text-[15px] shrink-0 ${isActive ? 'text-[#ff3535]' : 'text-zinc-500 group-hover:text-zinc-400'
                    }`}
                >
                  {isPublic ? <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path fill="currentColor" d="M6 2h12v2H6zm0 18h12v2H6zM18 4h2v2h-2zM4 18h2v2H4zM4 4h2v2H4zm14 14h2v2h-2zM2 6h2v12H2zm18 0h2v12h-2zM8 4h2v4H8zm2 4h4v2h-4zm4 2h4v2h-4zm4-2h2v2h-2zM4 12h2v2H4zm6 4h2v4h-2zm-4-2h4v2H6zm8 2h2v4h-2zm2-2h4v2h-4z" />
                  </svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                      <path d="M0 0h24v24H0z" fill="none" />
                      <path fill="currentColor" d="M5 8h14v2H5zm0 12h14v2H5zM3 10h2v10H3zm16 0h2v10h-2zM7 4h2v4H7zm2-2h6v2H9zm6 2h2v4h-2z" />
                    </svg>
                  }
                </span>
                <span className="truncate tracking-tight font-medium">
                  {room.name}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] shrink-0 shadow-[0_0_6px_#10b981]" />
                )}

                {!isPublic && (
                  <div className="hidden group-hover:flex items-center gap-1 text-zinc-400">
                    <button
                      type="button"
                      onClick={(e) => handleCopyLink(e, room.id)}
                      title={isCopied ? 'Link Copied!' : 'Copy Invite Link'}
                      className={`p-1 rounded hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer flex items-center ${isCopied ? 'text-[#10b981]' : ''
                        }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {isCopied ? 'check' : <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
                          <path d="M0 0h24v24H0z" fill="none" />
                          <path fill="currentColor" d="M4 6h7v2H4zm0 10h7v2H4zM2 8h2v8H2zm18-2h-7v2h7zm0 10h-7v2h7zm2-8h-2v8h2zM7 11h10v2H7z" />
                        </svg>
                        }
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => startEditing(e, room)}
                      title="Rename room"
                      className="p-1 rounded hover:bg-[#2e2e2e] hover:text-white transition-colors cursor-pointer flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path fill="currentColor" d="M4 16h2v2h2v2h2v2H2v-8h2zm8 4h-2v-2h2zm2-2h-2v-2h2zm-4-2H8v-2h2zm6 0h-2v-2h2zM6 14H4v-2h2zm6 0h-2v-2h2zm6 0h-2v-2h2zM8 12H6v-2h2zm6 0h-2v-2h2zm6 0h-2v-2h2zm-10-2H8V8h2zm8 0h-2V8h2zm4 0h-2V8h2zM12 8h-2V6h2zm4 0h-2V6h2zm4 0h-2V6h2zm-6-2h-2V4h2zm4 0h-2V4h2zm-2-2h-2V2h2z" />
                      </svg>

                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, room.id)}
                      title="Delete room"
                      className="p-1 rounded hover:bg-[#2e2e2e] hover:text-[#ff3535] transition-colors cursor-pointer flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path fill="currentColor" d="M18 22H6v-2h12zM9 6h6V4h2v2h5v2h-2v12h-2V8H6v12H4V8H2V6h5V4h2zm6-2H9V2h6z" />
                      </svg>

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
