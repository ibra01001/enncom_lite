import { useState, useEffect, useRef, type FC, type FormEvent, type MouseEvent } from 'react';
import gsap from 'gsap';
import { useSocket } from '../context/SocketContext';
import type { Room, RoomsListPayload, RoomCreatedPayload, RoomUpdatedPayload, RoomDeletedPayload } from '../types/chat';
import { useMls } from '../context/MlsContext';
import '../styles/features.css';

interface RoomsProps {
  currentRoom?: string;
  onSelectRoom?: (roomId: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Rooms: FC<RoomsProps> = ({ currentRoom = 'public', onSelectRoom, isOpen = false, onClose }) => {
  const { socket } = useSocket();
  const { createGroup } = useMls();
  const [rooms, setRooms] = useState<Room[]>([{ id: 'public', name: 'Public Chat' }]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const sidebarRef = useRef<HTMLElement | null>(null);
  const backdropRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sidebarRef.current;
    const bd = backdropRef.current;
    if (!el) return;
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      gsap.set(el, { clearProps: 'transform,x' });
      return;
    }
    if (isOpen) {
      gsap.fromTo(el, { x: '-100%' }, { x: '0%', duration: 0.38, ease: 'power2.inOut' });
      if (bd) gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    } else {
      gsap.to(el, { x: '-100%', duration: 0.32, ease: 'power2.inOut' });
      if (bd) gsap.to(bd, { opacity: 0, duration: 0.22, ease: 'power2.in' });
    }
  }, [isOpen]);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const onResize = () => { if (window.innerWidth >= 768) gsap.set(el, { clearProps: 'transform,x' }); };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit('get_my_rooms');
    const onList = (d: RoomsListPayload) => { if (d?.rooms) setRooms(d.rooms); };
    const onCreated = (d: RoomCreatedPayload) => {
      if (!d?.room) return;
      createGroup(d.room);
      setRooms(p => p.some(r => r.id === d.room) ? p : [...p, { id: d.room, name: d.name || d.room }]);
      navigator.clipboard.writeText(`${window.location.origin}/chatbox?room=${d.room}`).catch(() => { });
      onSelectRoom?.(d.room);
    };
    const onUpdated = (d: RoomUpdatedPayload) => { if (d?.room && d?.name) setRooms(p => p.map(r => r.id === d.room ? { ...r, name: d.name } : r)); };
    const onDeleted = (d: RoomDeletedPayload) => {
      if (!d?.room) return;
      setRooms(p => p.filter(r => r.id !== d.room));
      if (currentRoom === d.room) onSelectRoom?.('public');
    };
    socket.on('rooms_list', onList);
    socket.on('room_created', onCreated);
    socket.on('room_updated', onUpdated);
    socket.on('room_deleted', onDeleted);
    return () => {
      socket.off('rooms_list', onList);
      socket.off('room_created', onCreated);
      socket.off('room_updated', onUpdated);
      socket.off('room_deleted', onDeleted);
    };
  }, [socket, currentRoom, onSelectRoom, createGroup]);

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !newRoomName.trim()) return;
    socket.emit('create_room', { name: newRoomName.trim() });
    setNewRoomName(''); setIsCreating(false);
  };
  const handleUpdate = (e: FormEvent, id: string) => {
    e.preventDefault();
    if (!socket || !editingName.trim()) return;
    socket.emit('update_room', { room: id, name: editingName.trim() });
    setEditingRoomId(null); setEditingName('');
  };
  const handleDelete = (e: MouseEvent, id: string) => { e.stopPropagation(); if (socket) socket.emit('delete_room', { room: id }); };
  const startEdit = (e: MouseEvent, room: Room) => { e.stopPropagation(); setEditingRoomId(room.id); setEditingName(room.name); };
  const handleCopy = (e: MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/chatbox?room=${id}`).catch(() => { });
    setCopiedRoomId(id); setTimeout(() => setCopiedRoomId(null), 1800);
  };

  return (
    <>
      <div ref={backdropRef} onClick={onClose} className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] opacity-0 pointer-events-none" style={{ pointerEvents: isOpen ? 'auto' : 'none' }} />

      <aside
        ref={sidebarRef}
        className={[
          'fixed top-0 left-0 z-50 h-full translate-x-[-100%] md:relative md:translate-x-0 md:z-auto',
          'w-72 sm:w-80 shrink-0 bg-[#1a1a1a] border-r border-white/10',
          'flex flex-col select-none overflow-hidden',
        ].join(' ')}
      >
        {/* Header — clean, no //, no RFC */}
        <div className="shrink-0 px-4 h-14 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">


            <h4 className="font-mono text-[11px] font-bold tracking-widest uppercase text-zinc-300 truncate">Rooms</h4>
            <span className="font-mono text-[10px] text-zinc-500">{rooms.length}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsCreating(v => !v)}
              className={`px-2.5 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${isCreating ? 'bg-transparent text-zinc-400 hover:text-white' : 'bg-white text-black hover:bg-zinc-100'}`}
              title="Create room"
            >
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px] leading-none">{isCreating ? 'close' : 'add'}</span><span className="hidden sm:inline">{isCreating ? 'Cancel' : 'New'}</span></span>
            </button>
            <button type="button" onClick={onClose} className="md:hidden w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Close sidebar">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Create form — simple, sharp, no buzzwords */}
        {isCreating && (
          <form onSubmit={handleCreate} className="mx-3 mt-3 p-3 bg-[#272727] border border-white/10 flex flex-col gap-2.5">
            <input
              type="text"
              placeholder="Room name"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
              className="w-full bg-[#101010] text-white text-sm px-3 py-2 border border-white/10 focus:border-white/20 focus:outline-none placeholder-zinc-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" disabled={!newRoomName.trim()} className="flex-1 bg-white text-black text-xs font-mono font-bold uppercase tracking-widest py-2 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Create</button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-3 py-2 bg-transparent border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-xs font-mono uppercase tracking-widest transition-colors">Cancel</button>
            </div>
          </form>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          <div className="px-2 pb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-500">Channels</span>
          </div>

          {rooms.map(room => {
            const active = currentRoom === room.id;
            const editing = editingRoomId === room.id;
            const isPublic = room.id === 'public';
            const copied = copiedRoomId === room.id;

            if (editing) {
              return (
                <form key={room.id} onSubmit={e => handleUpdate(e, room.id)} className="mx-1 p-2 bg-[#272727] border border-white/10 flex items-center gap-2">
                  <input type="text" value={editingName} onChange={e => setEditingName(e.target.value)} className="flex-1 bg-[#101010] text-white text-xs px-2 py-1.5 border border-white/10 focus:outline-none focus:border-white/20" autoFocus />
                  <button type="submit" className="px-2.5 py-1.5 bg-white text-black text-xs font-mono font-bold uppercase hover:bg-zinc-100 transition-colors">Save</button>
                  <button type="button" onClick={() => setEditingRoomId(null)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5">✕</button>
                </form>
              );
            }

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom?.(room.id)}
                className={`group flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer transition-colors border ${active ? 'bg-white/[0.04] border-white/10 border-l-2 border-l-[#FF3535] text-white' : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.03] hover:border-white/5'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`material-symbols-outlined text-[16px] shrink-0 ${active ? 'text-[#FF3535]' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                    {isPublic ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M6 2h12v2H6zm0 18h12v2H6zM18 4h2v2h-2zM4 18h2v2H4zM4 4h2v2H4zm14 14h2v2h-2zM2 6h2v12H2zm18 0h2v12h-2zM8 4h2v4H8zm2 4h4v2h-4zm4 2h4v2h-4zm4-2h2v2h-2zM4 12h2v2H4zm6 4h2v4h-2zm-4-2h4v2H6zm8 2h2v4h-2zm2-2h4v2h-4z" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M5 8h14v2H5zm0 12h14v2H5zM3 10h2v10H3zm16 0h2v10h-2zM7 4h2v4H7zm2-2h6v2H9zm6 2h2v4h-2z" /></svg>
                    )}
                  </span>
                  <span className="truncate text-sm font-medium tracking-tight">{room.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!isPublic && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button type="button" onClick={e => handleCopy(e, room.id)} title={copied ? 'Copied' : 'Copy link'} className={`w-7 h-7 flex items-center justify-center hover:bg-white/5 hover:text-white transition-colors ${copied ? 'text-[#10B981]' : 'text-zinc-500'}`}>
                        <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M4 6h7v2H4zm0 10h7v2H4zM2 8h2v8H2zm18-2h-7v2h7zm0 10h-7v2h7zm2-8h-2v8h2zM7 11h10v2H7z" /></svg>}</span>
                      </button>
                      <button type="button" onClick={e => startEdit(e, room)} title="Rename" className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M4 16h2v2h2v2h2v2H2v-8h2zm8 4h-2v-2h2zm2-2h-2v-2h2zm-4-2H8v-2h2zm6 0h-2v-2h2zM6 14H4v-2h2zm6 0h-2v-2h2zm6 0h-2v-2h2zM8 12H6v-2h2zm6 0h-2v-2h2zm6 0h-2v-2h2zm-10-2H8V8h2zm8 0h-2V8h2zm4 0h-2V8h2zM12 8h-2V6h2zm4 0h-2V6h2zm4 0h-2V6h2zm-6-2h-2V4h2zm4 0h-2V4h2zm-2-2h-2V2h2z" /></svg>
                      </button>
                      <button type="button" onClick={e => handleDelete(e, room.id)} title="Delete" className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-[#FF3535] hover:bg-white/5 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" /><path fill="currentColor" d="M18 22H6v-2h12zM9 6h6V4h2v2h5v2h-2v12h-2V8H6v12H4V8H2V6h5V4h2zm6-2H9V2h6z" /></svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default Rooms;
