import { useState, useRef, useEffect, type FC, type KeyboardEvent } from 'react';
import { useSocket } from '../context/SocketContext';
import Rooms from './Rooms';
import type {
  Message,
  HistoryPayload,
  JoinErrorPayload,
} from '../types/chat';

const COLORS = {
  bg: '#1e1e1e',
  secondary: '#656565',
  accent: '#FF3535',
};

const Chatbox: FC = () => {
  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get('room');

  const [currentRoom, setCurrentRoom] = useState<string>(roomFromUrl || 'public');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef<number>(1);
  const clientMsgId = useRef<number>(0);
  const { socket, myId } = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Emit join_room for current active room
    const joinCurrentRoom = () => {
      socket.emit('join_room', { room: currentRoom });
    };

    // Join room immediately on mount / room change
    joinCurrentRoom();

    // Also re-join room if socket reconnects automatically
    socket.on('connect', joinCurrentRoom);

    const handleHistory = (data: HistoryPayload) => {
      // Handle both object payload { room, history } and legacy array
      const historyMsgs = Array.isArray(data) ? data : data?.history || [];
      const targetRoom = Array.isArray(data) ? 'public' : data?.room || 'public';

      if (targetRoom === currentRoom && historyMsgs.length >= 0) {
        const formatted: Message[] = historyMsgs.map((msg) => ({
          ...msg,
          id: msg.id || nextId.current++,
        }));
        setMessages(formatted);
      }
    };

    const handleMessage = (msg: Message) => {
      // Ignore messages meant for other rooms
      if (msg.room && msg.room !== currentRoom) return;

      // If this client sent the message, reconcile the pending optimistic message
      if (msg.clientMsgId !== undefined) {
        setMessages((prev) => {
          const hasPending = prev.some(
            (m) => m.pending && m.clientMsgId === msg.clientMsgId
          );
          if (hasPending) {
            return prev.map((m) =>
              m.pending && m.clientMsgId === msg.clientMsgId
                ? { ...m, ...msg, pending: false }
                : m
            );
          }
          // Message from another client that happened to have clientMsgId
          return [...prev, { ...msg, id: nextId.current++ }];
        });
        return;
      }

      // System message or fallback — add it
      const newMsg: Message = { ...msg, id: nextId.current++ };
      setMessages((prev) => [...prev, newMsg]);
    };

    const handleJoinError = (data: JoinErrorPayload) => {
      // The invite link points to a deleted or non-existent room
      setJoinError(data?.message || 'Room not found.');
      setCurrentRoom('public');
      socket.emit('join_room', { room: 'public' });
    };

    const handleInitialHistory = (data: HistoryPayload) => {
      // After successfully joining a private room via link, refresh the sidebar
      const targetRoom = Array.isArray(data) ? 'public' : data?.room || 'public';
      if (targetRoom !== 'public') {
        socket.emit('get_my_rooms');
      }
      handleHistory(data);
    };

    socket.on('initial history', handleInitialHistory);
    socket.on('chat message', handleMessage);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('connect', joinCurrentRoom);
      socket.off('initial history', handleInitialHistory);
      socket.off('chat message', handleMessage);
      socket.off('join_error', handleJoinError);
    };
  }, [socket, currentRoom]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msgClientId = clientMsgId.current++;
    const localId = nextId.current++;

    // Optimistic: add to UI immediately with pending state
    setMessages((prev) => [
      ...prev,
      {
        id: localId,
        clientMsgId: msgClientId,
        senderId: myId,
        text: trimmed,
        room: currentRoom,
        pending: true,
      },
    ]);

    // Send to server with room identifier
    if (socket) {
      socket.emit('chat message', {
        text: trimmed,
        clientMsgId: msgClientId,
        room: currentRoom,
      });
    }

    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  const isEmpty = !input.trim();

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      }}
      className="w-full h-full flex flex-row overflow-hidden flex-1"
    >
      {joinError && (
        <div
          style={{ backgroundColor: '#FF3535', color: '#fff', fontSize: 13 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 font-semibold shadow-lg flex items-center gap-3"
        >
          <span>⚠ {joinError}</span>
          <button
            onClick={() => setJoinError(null)}
            className="ml-2 font-bold opacity-80 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      <style>{`
        .pc-input::placeholder { color: rgba(255,255,255,0.3); }
        .pc-input:focus { border-color: rgba(255,255,255,0.6); }
        .pc-btn:focus-visible { outline: 1px solid #FF3535; outline-offset: 2px; }
        .pc-scroll::-webkit-scrollbar { width: 8px; }
        .pc-scroll::-webkit-scrollbar-track { background: transparent; }
        .pc-scroll::-webkit-scrollbar-thumb { background: #656565; }
      `}</style>

      {/* Rooms Sidebar */}
      <Rooms currentRoom={currentRoom} onSelectRoom={setCurrentRoom} />

      {/* Main Chat Box */}
      <div className="flex-1 h-full flex flex-col min-w-0 bg-[#1e1e1e]">
        {/* Chat Header */}
        <div
          style={{
            backgroundColor: '#2A2A2A',
            borderBottom: `1px solid ${COLORS.accent}`,
          }}
          className="h-14 shrink-0 flex items-center justify-between px-6"
        >
          <div className="flex items-center gap-2">
            <h4 className="text-white font-bold text-base m-0 capitalize">
              #{currentRoom === 'public' ? 'Public Chat' : currentRoom}
            </h4>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.6)' }} className="text-xs font-mono font-semibold">
            You are #{myId ?? '...'}
          </span>
        </div>

        {/* Messages Container */}
        <div ref={scrollRef} className="pc-scroll text-left flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          {messages.map((msg) => {
            const isOwn = msg.senderId === myId;
            return (
              <div
                key={msg.id}
                className="flex flex-col gap-0.5"
                style={{ opacity: msg.pending ? 0.5 : 1 }}
              >
                <span style={{ color: isOwn ? COLORS.accent : 'rgba(255,255,255,0.5)' }} className="text-xs font-semibold">
                  #{msg.senderId}
                </span>
                <p className="text-white text-sm leading-relaxed break-words m-0">
                  {msg.text}
                </p>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div
          style={{ borderTop: `1px solid ${COLORS.accent}` }}
          className="shrink-0 flex items-center gap-3 px-6 py-4 bg-[#1e1e1e]"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message"
            aria-label="Message"
            style={{
              backgroundColor: COLORS.bg,
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#ffffff',
              borderRadius: 0,
            }}
            className="pc-input flex-1 text-sm px-4 py-2.5 outline-none min-w-0"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isEmpty}
            style={{
              backgroundColor: COLORS.secondary,
              border: `1px solid ${COLORS.secondary}`,
              borderRadius: 0,
              opacity: isEmpty ? 0.5 : undefined,
              cursor: isEmpty ? 'not-allowed' : 'pointer',
            }}
            className="pc-btn text-white text-sm font-bold px-6 py-2.5 shrink-0 hover:opacity-80 active:opacity-70 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbox;
