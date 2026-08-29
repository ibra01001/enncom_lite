import { useState, useRef, useEffect, type FC, type KeyboardEvent } from 'react';
import { useSocket } from '../context/SocketContext';
import Rooms from './Rooms';
import { useMls } from '../context/MlsContext';
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
  const [currentRoom, setCurrentRoom] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || 'public';
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef<number>(1);
  const clientMsgId = useRef<number>(0);
  const { socket, myId } = useSocket();
  const { hasGroup, encryptMessage, decryptMessage } = useMls();

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
        const formatted: Message[] = historyMsgs.map((msg) => {
          let displayText = msg.text;
          if (msg.ciphertext) {
            const decrypted = decryptMessage(targetRoom, msg.ciphertext);
            displayText = decrypted || '[Encrypted Message]';
          }
          return {
            ...msg,
            text: displayText ?? '',
            id: msg.id || nextId.current++,
          };
        });
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
                ? { ...m, ...msg, text: m.text || msg.text, pending: false }
                : m
            );
          }
          // Message from another client that happened to have clientMsgId
          let displayText = msg.text;
          if (msg.ciphertext) {
            const decrypted = decryptMessage(msg.room || currentRoom, msg.ciphertext);
            displayText = decrypted || '[Unable to decrypt]';
          }
          return [...prev, { ...msg, text: displayText ?? '', id: nextId.current++ }];
        });
        return;
      }

      // Decrypt incoming message if it contains ciphertext
      let displayText = msg.text;
      if (msg.ciphertext) {
        const decrypted = decryptMessage(msg.room || currentRoom, msg.ciphertext);
        displayText = decrypted || '[Unable to decrypt]';
      }

      // System message or other client's message
      const newMsg: Message = {
        ...msg,
        text: displayText ?? '',
        id: nextId.current++,
      };
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
  }, [socket, currentRoom, decryptMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isPrivateRoom = currentRoom !== 'public';
  const isGroupActive = hasGroup(currentRoom);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const msgClientId = clientMsgId.current++;
    const localId = nextId.current++;

    if (isPrivateRoom) {
      if (!isGroupActive) {
        setJoinError("You are not a member of this MLS group or encryption is still initializing.");
        return;
      }

      const ciphertext = encryptMessage(currentRoom, trimmed);
      if (!ciphertext) {
        setJoinError("Failed to encrypt message with OpenMLS.");
        return;
      }

      // Optimistic message in UI
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          clientMsgId: msgClientId,
          senderId: myId,
          text: trimmed,
          ciphertext,
          room: currentRoom,
          pending: true,
        },
      ]);

      // Emit encrypted payload to server
      if (socket) {
        socket.emit('chat message', {
          ciphertext,
          clientMsgId: msgClientId,
          room: currentRoom,
        });
      }
    } else {
      // Public room: unencrypted message
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

      if (socket) {
        socket.emit('chat message', {
          text: trimmed,
          clientMsgId: msgClientId,
          room: currentRoom,
        });
      }
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
          <div className="flex items-center gap-3">
            <h4 className="text-white font-bold text-base m-0 capitalize">
              #{currentRoom === 'public' ? 'Public Chat' : currentRoom}
            </h4>
            {isPrivateRoom ? (
              <span
                className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded flex items-center gap-1 ${isGroupActive
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50'
                    : 'bg-amber-950 text-amber-400 border border-amber-700/50'
                  }`}
              >
                <span>{isGroupActive ? 'E2EE Active' : 'Awaiting Keys'}</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                Public Unencrypted
              </span>
            )}
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
                <div className="flex items-center gap-2">
                  <span style={{ color: isOwn ? COLORS.accent : 'rgba(255,255,255,0.5)' }} className="text-xs font-semibold">
                    #{msg.senderId}
                  </span>
                  {msg.ciphertext && (
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold" title="End-to-End Encrypted via OpenMLS">
                      [enc]
                    </span>
                  )}
                  {msg.pending && (
                    <span className="text-[10px] text-zinc-500 font-mono">
                      sending...
                    </span>
                  )}
                </div>
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
            placeholder={
              isPrivateRoom && !isGroupActive
                ? "Connecting to MLS group session..."
                : isPrivateRoom
                  ? "Send encrypted message..."
                  : "Send public message..."
            }
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
            disabled={isEmpty || (isPrivateRoom && !isGroupActive)}
            style={{
              backgroundColor: COLORS.secondary,
              border: `1px solid ${COLORS.secondary}`,
              borderRadius: 0,
              opacity: isEmpty || (isPrivateRoom && !isGroupActive) ? 0.5 : undefined,
              cursor: isEmpty || (isPrivateRoom && !isGroupActive) ? 'not-allowed' : 'pointer',
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
