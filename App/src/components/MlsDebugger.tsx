import { useState, type FC } from 'react';
import { useMls } from '../context/MlsContext';
import { useSocket } from '../context/SocketContext';
import { clearAllMlsStorage } from '../utils/indexedDb';

interface MlsDebuggerProps {
  currentRoom: string;
  isOwner?: boolean;
  activePeers?: string[];
  onClose?: () => void;
}

const COLORS = {
  bg: '#141414',
  cardBg: '#1e1e1e',
  accent: '#FF3535',
  border: '#2e2e2e',
  textMuted: '#9ca3af',
  emerald: '#10b981',
  amber: '#f59e0b',
};

const MlsDebugger: FC<MlsDebuggerProps> = ({
  currentRoom,
  isOwner = false,
  activePeers = [],
  onClose,
}) => {
  const { myId } = useSocket();
  const {
    isInitialized,
    hasGroup,
    getGroupEpoch,
    requestWelcome,
    recreateGroupAsOwner,
    republishKeyPackages,
    debugLogs,
    keyPackagesCount,
  } = useMls();

  const [copied, setCopied] = useState(false);
  const [clearing, setClearing] = useState(false);

  const isPrivate = currentRoom !== 'public';
  const groupActive = isPrivate && hasGroup(currentRoom);
  const currentEpoch = isPrivate ? getGroupEpoch(currentRoom) : 0;

  const copyId = () => {
    if (!myId) return;
    navigator.clipboard.writeText(myId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClearDb = async () => {
    if (!window.confirm('Clear local IndexedDB MLS cache? You will need to refresh.')) return;
    setClearing(true);
    await clearAllMlsStorage();
    setClearing(false);
    window.location.reload();
  };

  return (
    <div
      style={{
        backgroundColor: COLORS.bg,
        borderLeft: `1px solid ${COLORS.border}`,
        fontFamily: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
      }}
      className="w-80 md:w-96 h-full flex flex-col shrink-0 text-left text-xs text-white select-text z-20 shadow-2xl"
    >
      {/* Header */}
      <div
        style={{ borderBottom: `1px solid ${COLORS.border}` }}
        className="h-14 px-4 flex items-center justify-between bg-[#1a1a1a] shrink-0"
      >
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="font-bold text-sm tracking-tight text-white m-0">MLS Inspector</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            E2EE
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 cursor-pointer transition-colors"
            title="Close Debug Panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Card 1: MLS Identity */}
        <div
          style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}
          className="border rounded p-3.5 flex flex-col gap-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-400">
              Cryptographic Identity
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                isInitialized
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isInitialized ? 'WASM Ready' : 'Loading...'}
            </span>
          </div>

          <div className="flex items-center justify-between bg-black/40 p-2 rounded border border-white/5">
            <span className="text-zinc-400">User Short ID:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">#{myId ?? '...'}</span>
              <button
                type="button"
                onClick={copyId}
                className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
              >
                {copied ? 'copied!' : 'copy'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-black/20 p-2 rounded border border-white/5 flex flex-col">
              <span className="text-zinc-400">KeyPackages</span>
              <span className="font-bold text-white">{keyPackagesCount} ready</span>
            </div>
            <div className="bg-black/20 p-2 rounded border border-white/5 flex flex-col">
              <span className="text-zinc-400">Storage</span>
              <span className="font-bold text-emerald-400">IndexedDB (v1)</span>
            </div>
          </div>

          <div className="text-[10px] text-zinc-400 truncate">
            Cipher: <span className="text-zinc-300">MLS_128_Ed25519_ChaCha20</span>
          </div>
        </div>

        {/* Card 2: MLS Group & Room State */}
        <div
          style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}
          className="border rounded p-3.5 flex flex-col gap-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-400">
              Active Room Group
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                !isPrivate
                  ? 'bg-zinc-800 text-zinc-400'
                  : groupActive
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}
            >
              {!isPrivate ? 'Public (Plaintext)' : groupActive ? '🔒 In Group' : '⏳ Awaiting Keys'}
            </span>
          </div>

          <div className="flex flex-col gap-1 bg-black/40 p-2 rounded border border-white/5">
            <div className="flex justify-between">
              <span className="text-zinc-400">Room:</span>
              <span className="font-semibold text-white truncate max-w-[170px]">{currentRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Role:</span>
              <span className={`font-semibold ${isOwner ? 'text-amber-400' : 'text-zinc-300'}`}>
                {isOwner ? '👑 Room Owner (Founder)' : '👤 Invited Member'}
              </span>
            </div>
            {isPrivate && (
              <div className="flex justify-between">
                <span className="text-zinc-400">MLS Epoch:</span>
                <span className="font-bold text-emerald-400">#{currentEpoch}</span>
              </div>
            )}
          </div>

          {/* Connected Peers in room */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-zinc-400">
              Connected Sockets ({activePeers.length}):
            </span>
            <div className="flex flex-wrap gap-1">
              {activePeers.length === 0 ? (
                <span className="text-[10px] text-zinc-400 italic">No peers detected</span>
              ) : (
                activePeers.map((p) => (
                  <span
                    key={p}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      p === myId
                        ? 'bg-red-950 text-red-300 border border-red-800'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    #{p} {p === myId ? '(you)' : ''}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Cryptographic Actions */}
        <div
          style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}
          className="border rounded p-3.5 flex flex-col gap-2 shadow-sm"
        >
          <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-400 mb-1">
            Debug & Recovery Actions
          </span>

          <div className="grid grid-cols-1 gap-2">
            {isPrivate && !groupActive && (
              <button
                type="button"
                onClick={() => requestWelcome(currentRoom)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-1.5 px-3 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Request Welcome from Peers</span>
                <span className="text-amber-400 text-xs">↻</span>
              </button>
            )}

            {isPrivate && isOwner && (
              <button
                type="button"
                onClick={() => recreateGroupAsOwner(currentRoom)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-semibold py-1.5 px-3 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
              >
                <span>Re-initialize Group as Owner</span>
                <span className="text-xs">👑</span>
              </button>
            )}

            <button
              type="button"
              onClick={republishKeyPackages}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-1.5 px-3 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Republish KeyPackages Pool</span>
              <span className="text-emerald-400 text-xs">+10</span>
            </button>

            <button
              type="button"
              onClick={handleClearDb}
              disabled={clearing}
              className="w-full bg-red-950/40 hover:bg-red-950/80 text-red-400 border border-red-900/50 py-1.5 px-3 rounded text-left flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>Reset Local IndexedDB Cache</span>
              <span className="text-xs">🗑</span>
            </button>
          </div>
        </div>

        {/* Card 4: Live Event Stream */}
        <div
          style={{ backgroundColor: COLORS.cardBg, borderColor: COLORS.border }}
          className="border rounded p-3.5 flex flex-col gap-2 flex-1 min-h-[160px] shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase tracking-wider text-[11px] text-zinc-400">
              Live MLS Event Log
            </span>
            <span className="text-[10px] text-zinc-400">{debugLogs.length} events</span>
          </div>

          <div className="flex-1 bg-black/50 p-2 rounded border border-white/5 overflow-y-auto max-h-48 flex flex-col gap-1.5 text-[10px] font-mono select-text">
            {debugLogs.length === 0 ? (
              <span className="text-zinc-400 italic">No events recorded yet...</span>
            ) : (
              debugLogs.map((log) => {
                const colorMap = {
                  info: 'text-zinc-300',
                  success: 'text-emerald-400 font-semibold',
                  warn: 'text-amber-400',
                  error: 'text-red-400 font-bold',
                };
                return (
                  <div key={log.id} className="flex gap-2 items-start break-all leading-tight">
                    <span className="text-zinc-400 shrink-0">{log.time}</span>
                    <span className={colorMap[log.type]}>{log.msg}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MlsDebugger;
