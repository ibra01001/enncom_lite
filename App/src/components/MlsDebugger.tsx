import { useState, type FC, type ReactNode } from 'react';
import { useMls } from '../context/MlsContext';
import { useSocket } from '../context/SocketContext';
import { clearAllMlsStorage } from '../utils/indexedDb';

interface MlsDebuggerProps {
  currentRoom: string;
  isOwner?: boolean;
  activePeers?: string[];
  onClose?: () => void;
}

interface SectionProps {
  label: string;
  tag?: string;
  tagColor?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

const Section: FC<SectionProps> = ({
  label,
  tag,
  tagColor = 'text-[#FF3535]',
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      {/* Dropdown Section Header Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-4 px-5 hover:bg-white/[0.02] transition-colors cursor-pointer select-none group text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-1.5 h-1.5 bg-[#FF3535] shrink-0" />
          <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-zinc-400 tracking-widest uppercase truncate">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {tag && (
            <span
              className={`font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider ${tagColor}`}
            >
              {tag}
            </span>
          )}
          <span
            className={`font-['JetBrains_Mono',monospace] text-[13px] transition-transform duration-200 ${open ? 'rotate-180 text-white' : 'rotate-0 text-zinc-500'
              }`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Collapsible Section Body (No Cards, Seamless Flow) */}
      {open && (
        <div className="px-5 pb-5 flex flex-col gap-3 animate-in fade-in duration-150">
          {children}
        </div>
      )}
    </div>
  );
};

const MetricRow: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="pt-2 border-t border-white/5 font-['JetBrains_Mono',monospace] text-[11px] flex items-center justify-between gap-2 min-w-0">
    <span className="text-zinc-500 uppercase tracking-wider shrink-0">{label}</span>
    <div className="text-[#e5e2e1] font-semibold text-right truncate min-w-0">{children}</div>
  </div>
);

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
    syncEpoch,
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
    navigator.clipboard.writeText(myId).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleClearDb = async () => {
    if (!window.confirm('Clear local IndexedDB MLS cache? You will need to refresh the page.')) return;
    setClearing(true);
    await clearAllMlsStorage();
    setClearing(false);
    window.location.reload();
  };

  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/60 z-40 backdrop-blur-xs xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-[85vw] sm:max-w-[380px] xl:static xl:w-96 xl:max-w-none h-full flex flex-col shrink-0 text-left text-xs bg-[#272727] text-[#e5e2e1] font-['Hanken_Grotesk',sans-serif] border-l border-white/10 select-text shadow-2xl animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Inspector Header */}
        <header className="h-16 px-5 flex items-center justify-between bg-[#272727] border-b border-white/10 shrink-0 select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.6em"
              height="1.6em"
              viewBox="0 0 24 24"
              className="text-[#FF3535] shrink-0"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                fill="currentColor"
                d="M8 6h8v2H8zm0 14h8v2H8zM6 8h2v12H6zm10 0h2v12h-2zM4 8h2v2H4zm16 0h-2v2h2zM4 18h2v2H4zm16 0h-2v2h2zM2 20h2v2H2zm20 0h-2v2h2zM2 6h2v2H2zm20 0h-2v2h2zM2 13h4v2H2zm20 0h-4v2h4zM6 2h2v2H6zm2 2h2v2H8zm6 0h2v2h-2zm2-2h2v2h-2zm-6 8h4v2h-4zm0 4h4v2h-4z"
              />
            </svg>

            <h2 className="font-bold text-sm tracking-tight text-[#e5e2e1] m-0">
              MLS Inspector
            </h2>

          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${groupActive
                  ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]'
                  : 'bg-[#f59e0b] animate-pulse'
                  }`}
              />
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 font-bold uppercase">
                {groupActive ? 'LIVE' : 'IDLE'}
              </span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/[0.05] border border-transparent hover:border-white/10 cursor-pointer transition-colors"
                title="Close Inspector"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </header>

        {/* Seamless Integrated Flow (HowItWorksSteps Style, Collapsible Dropdowns) */}
        <div className="flex-1 overflow-y-auto text-xs">
          {/* ── STEP 01 · IDENTITY ── */}
          <Section
            label="01 — Prekeys"
            tag={isInitialized ? 'RFC 9420 §7' : 'INITIALIZING'}
            tagColor={isInitialized ? 'text-[#FF3535]' : 'text-[#f59e0b]'}
            defaultOpen={true}
          >


            <div className="mt-1 flex flex-col">
              <MetricRow label="Short ID">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-bold">#{myId ?? '...'}</span>
                  <button
                    type="button"
                    onClick={copyId}
                    className="text-[10px] text-zinc-400 hover:text-[#FF3535] underline cursor-pointer transition-colors"
                  >
                    {copied ? 'copied!' : 'copy'}
                  </button>
                </div>
              </MetricRow>
              <MetricRow label="KeyPackages">
                <span className={keyPackagesCount > 0 ? 'text-[#10B981]' : 'text-[#f59e0b]'}>
                  {keyPackagesCount} ready
                </span>
              </MetricRow>
              <MetricRow label="Storage">
                <span className="text-zinc-300">IndexedDB (v1)</span>
              </MetricRow>
              <MetricRow label="Cipher">
                <span className="text-[#FF3535]">MLS_128_Ed25519_ChaCha20</span>
              </MetricRow>
            </div>
          </Section>

          {/* ── STEP 02 · TREEKEM RATCHET ── */}
          <Section
            label="02 — TreeKEM"
            tag={groupActive ? 'O(log N)' : 'PENDING'}
            tagColor={groupActive ? 'text-[#FF3535]' : 'text-[#f59e0b]'}
            defaultOpen={true}
          >


            <div className="mt-1 flex flex-col">
              <MetricRow label="Session">
                <span className="text-white">{currentRoom}</span>
              </MetricRow>
              <MetricRow label="Role">
                <span className={isOwner ? 'text-[#f59e0b] font-bold' : 'text-zinc-300'}>
                  {isOwner ? ' ROOM OWNER (FOUNDER)' : ' VERIFIED MEMBER'}
                </span>
              </MetricRow>
              {isPrivate && (
                <MetricRow label="Epoch">
                  <span className="text-[#10B981] font-bold">#{currentEpoch} [SYNCED]</span>
                </MetricRow>
              )}
              <MetricRow label="Secrecy">
                <span className="text-[#FF3535]">CONTINUOUS</span>
              </MetricRow>

              {/* Connected Peers in room */}
              <div className="pt-2.5 mt-2 border-t border-white/5 flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase tracking-wider">
                  <span>Connected Sockets</span>
                  <span className="text-zinc-300 font-semibold">{activePeers.length}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activePeers.length === 0 ? (
                    <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 italic">
                      No peers connected
                    </span>
                  ) : (
                    activePeers.map((p) => (
                      <span
                        key={p}
                        className={`font-['JetBrains_Mono',monospace] text-[10px] px-1.5 py-0.5 ${p === myId
                          ? 'bg-[#291212] text-[#ff8080] border border-[#ff3535]/50 font-bold'
                          : 'bg-[#1e1e1e] text-zinc-300 border border-white/10'
                          }`}
                      >
                        #{p}
                        {p === myId ? ' (you)' : ''}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </Section>

          {/* ── STEP 03 · PROTOCOL ACTIONS ── */}
          <Section
            label="03 — Controls"
            tag="RECOVERY"
            tagColor="text-zinc-400"
            defaultOpen={false}
          >


            <div className="mt-2 flex flex-col gap-2 font-['JetBrains_Mono',monospace]">
              {isPrivate && !groupActive && (
                <button
                  type="button"
                  onClick={() => requestWelcome(currentRoom)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer group"
                >
                  <span className="text-[11px] uppercase tracking-wider text-zinc-300 group-hover:text-white">
                    Request Welcome Packet
                  </span>
                  <span className="material-symbols-outlined text-[#f59e0b] text-[16px]">sync</span>
                </button>
              )}

              {isPrivate && (
                <button
                  type="button"
                  onClick={() => syncEpoch(currentRoom)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-[#10B981]/40 text-white transition-all cursor-pointer group"
                >
                  <span className="text-[11px] uppercase tracking-wider text-zinc-300 group-hover:text-[#10B981]">
                    Synchronize Ratchet Epoch
                  </span>
                  <span className="material-symbols-outlined text-[#10B981] text-[16px]">sync</span>
                </button>
              )}

              {isPrivate && isOwner && (
                <button
                  type="button"
                  onClick={() => recreateGroupAsOwner(currentRoom)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-[#f59e0b]/40 text-[#f59e0b] transition-all cursor-pointer group"
                >
                  <span className="text-[11px] uppercase tracking-wider group-hover:text-[#fbbf24]">
                    Re-initialize as Owner
                  </span>
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                </button>
              )}

              <button
                type="button"
                onClick={republishKeyPackages}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent hover:bg-white/[0.04] border border-white/10 hover:border-white/20 text-white transition-all cursor-pointer group"
              >
                <span className="text-[11px] uppercase tracking-wider text-zinc-300 group-hover:text-white">
                  Replenish KeyPackages
                </span>
                <span className="text-[#10B981] font-bold text-[13px]">+10</span>
              </button>

              <button
                type="button"
                onClick={handleClearDb}
                disabled={clearing}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-transparent hover:bg-[#FF3535]/10 border border-white/10 hover:border-[#FF3535]/40 text-[#ff8080] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <span className="text-[11px] uppercase tracking-wider group-hover:text-[#FF3535]">
                  Reset IndexedDB Cache
                </span>
                <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              </button>
            </div>
          </Section>

          {/* ── STEP 04 · EVENT STREAM ── */}
          <Section
            label="04 — Telemetry"
            tag={`${debugLogs.length} events`}
            tagColor="text-zinc-500"
            defaultOpen={true}
          >


            <div className="mt-1 bg-[#1e1e1e] border border-white/10 p-2.5 font-['JetBrains_Mono',monospace] text-[10px]">
              <div className="overflow-y-auto max-h-48 flex flex-col divide-y divide-white/5">
                {debugLogs.length === 0 ? (
                  <div className="py-2 text-zinc-600 italic">
                    Listening for OpenMLS protocol events...
                  </div>
                ) : (
                  debugLogs.map((log) => {
                    const colorMap: Record<string, string> = {
                      info: 'text-zinc-400',
                      success: 'text-[#10B981] font-semibold',
                      warn: 'text-[#f59e0b]',
                      error: 'text-[#FF3535] font-bold',
                    };
                    return (
                      <div
                        key={log.id}
                        className="py-1 flex gap-2 items-start break-all leading-tight"
                      >
                        <span className="text-zinc-600 shrink-0 select-none">
                          [{log.time}]
                        </span>
                        <span className={colorMap[log.type] ?? 'text-zinc-300'}>
                          {log.msg}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </Section>
        </div>
      </aside>
    </>
  );
};

export default MlsDebugger;
