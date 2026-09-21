import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CallParticipant, CallLayoutMode, TelecomMetrics, FloatingReaction } from './callTypes';
import { useAdaptiveCallLayout, useIsMobile } from './useAdaptiveCallLayout';

interface VideoCallProps {
  roomId: string;
  isPrivateRoom?: boolean;
  myId?: string | null;
  onClose?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  roomId: _roomId,
  isPrivateRoom = false,
  myId = 'local-user',
  onClose,
  onToggleChat,
  isChatOpen = false,
}) => {
  void _roomId;
  const [layoutMode, setLayoutMode] = useState<CallLayoutMode>('grid');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [showVolumeFor, setShowVolumeFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Call-stage container — THIS is what we measure (not window)
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLElement | null>(null);
  const [dockH, setDockH] = useState(88);
  const isMobile = useIsMobile(768);

  // keep dock height measured so grid reserve is accurate
  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setDockH(Math.ceil(e.contentRect.height) + 20);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [participants, setParticipants] = useState<CallParticipant[]>([
    {
      id: myId || 'user-local',
      name: `YOU [${(myId || 'LOCAL').slice(0, 6).toUpperCase()}]`,
      isLocal: true,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 0,
      volume: 100,
      signalStrength: 3,
      role: 'HOST',
      avatarColor: '#ff3535',
    },
    {
      id: 'peer-alex-92',
      name: 'ALICE ',
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: true,
      isSpeaking: true,
      audioLevel: 80,
      volume: 100,
      signalStrength: 3,
      role: 'PEER_01',
      avatarColor: '#242424',
    },
    {
      id: 'peer-elena-44',
      name: 'BOB [NODE_OPERATOR]',
      isLocal: false,
      isMuted: true,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 0,
      volume: 90,
      signalStrength: 2,
      role: 'PEER_02',
      avatarColor: '#1c1c1c',
    },
    {
      id: 'peer-cipher-10',
      name: 'ZERO_KNOWLEDGE [VALIDATOR]',
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 25,
      volume: 100,
      signalStrength: 3,
      role: 'PEER_03',
      avatarColor: '#202020',
    },
  ]);

  const [metrics, setMetrics] = useState<TelecomMetrics>({
    ping: 18,
    jitter: 2,
    packetLoss: 0.0,
    bitrateIn: 2450,
    bitrateOut: 1820,
    videoCodec: 'VP9 (Profile 0 / YUV420P)',
    audioCodec: 'Opus 48kHz Stereo (E2EE SFrame)',
    resolution: '1920x1080@60fps',
    e2eeProtocol: 'MLS RFC 9420 TreeKEM Ratchet',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isLocal) {
            return { ...p, isMuted: isMicMuted, isDeafened: isDeafened, isVideoOn: isVideoOn, isScreenSharing: isScreenSharing };
          }
          if (p.isMuted) return { ...p, isSpeaking: false, audioLevel: 0 };
          const shouldSpeak = Math.random() > 0.45;
          return { ...p, isSpeaking: shouldSpeak, audioLevel: shouldSpeak ? Math.floor(Math.random() * 80 + 20) : 0 };
        })
      );
      setMetrics((m) => ({ ...m, ping: Math.floor(16 + Math.random() * 6), bitrateIn: Math.floor(2300 + Math.random() * 300) }));
    }, 1800);
    return () => clearInterval(interval);
  }, [isMicMuted, isDeafened, isVideoOn, isScreenSharing]);

  // Reset pagination when count or layout changes
  useEffect(() => setCurrentPage(0), [participants.length, layoutMode]);

  const handleToggleCamera = async () => {
    if (isVideoOn) {
      if (localStreamRef.current) { localStreamRef.current.getTracks().forEach((t) => t.stop()); localStreamRef.current = null; }
      setIsVideoOn(false);
      setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isVideoOn: false, stream: null } : p)));
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        setIsVideoOn(true);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isVideoOn: true, stream } : p)));
      } catch (err) {
        console.warn('Camera access denied', err);
        setIsVideoOn(true);
        setParticipants((prev) => prev.map((p) => (p.isLocal ? { ...p, isVideoOn: true } : p)));
      }
    }
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) { screenStreamRef.current.getTracks().forEach((t) => t.stop()); screenStreamRef.current = null; }
      setIsScreenSharing(false);
      if (spotlightId === 'local-screenshare') setSpotlightId(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as DisplayMediaStreamOptions);
        screenStreamRef.current = stream;
        if (screenShareVideoRef.current) screenShareVideoRef.current.srcObject = stream;
        setIsScreenSharing(true);
        setLayoutMode('spotlight');
        setSpotlightId('local-screenshare');
        stream.getVideoTracks()[0].onended = () => { setIsScreenSharing(false); setSpotlightId(null); };
      } catch {
        setIsScreenSharing(true);
        setLayoutMode('spotlight');
        setSpotlightId('local-screenshare');
      }
    }
  };

  const handleTriggerReaction = useCallback((emoji: string) => {
    const newReaction: FloatingReaction = { id: Math.random().toString(), emoji, senderName: 'YOU', x: Math.floor(20 + Math.random() * 60) };
    setReactions((prev) => [...prev, newReaction]);
    setShowReactionsMenu(false);
    setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== newReaction.id)), 2800);
  }, []);

  const handleAddParticipant = useCallback(() => {
    const num = participants.length + 1;
    const id = `peer-node-0${num}`;
    const newPeer: CallParticipant = {
      id,
      name: num % 3 === 0 ? `ZERO_KNOWLEDGE [VALIDATOR_${num}]` : `PEER_0${num} [ANONYMOUS]`,
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: Math.random() > 0.5,
      isSpeaking: false,
      audioLevel: 0,
      volume: 100,
      signalStrength: (Math.random() > 0.3 ? 3 : 2) as 2 | 3,
      role: `NODE_${num}`,
      avatarColor: '#202020',
    };
    setParticipants((prev) => [...prev, newPeer]);
  }, [participants.length]);

  const handleRemoveParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    setSpotlightId((prev) => (prev === id ? null : prev));
  }, []);

  const handleVolumeChange = useCallback((id: string, vol: number) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, volume: vol } : p)));
  }, []);

  // Adaptive layout — measured from actual stage, gap scales with viewport
  const gap = isMobile ? 8 : 12;
  const adaptive = useAdaptiveCallLayout(stageRef, participants.length, {
    gap,
    minTileW: isMobile ? 132 : 156,
    minTileH: isMobile ? 84 : 96,
    maxTileH: isMobile ? 260 : 360,
    controlDockReserve: dockH,
    currentPage,
  });

  const { columns, totalPages, visibleCount, tileW } = adaptive;

  // Pagination slice — stable order (no speaking re-sort; keep positions stable)
  const paginatedParticipants = useMemo(() => {
    if (totalPages <= 1) return participants;
    const start = currentPage * visibleCount;
    return participants.slice(start, start + visibleCount);
  }, [participants, currentPage, visibleCount, totalPages]);

  // Tile density derived from computed tileW (not viewport)
  const tileDensity: TileDensity = useMemo(() => {
    if (tileW >= 300) return 'large';
    if (tileW >= 220) return 'medium';
    if (tileW >= 160) return 'small';
    return 'tiny';
  }, [tileW]);

  const spotlightParticipant = useMemo(() => {
    if (spotlightId === 'local-screenshare') {
      return { id: 'local-screenshare', name: 'LOCAL SCREEN TRANSMISSION', isLocal: true, isMuted: false, isVideoOn: true, isScreenSharing: true, isSpeaking: false, volume: 100, signalStrength: 3 as const };
    }
    return participants.find((p) => p.id === spotlightId) || participants[0];
  }, [spotlightId, participants]);

  if (!isPrivateRoom) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181818] p-8 text-center select-none font-['JetBrains_Mono',monospace]">
        <div className="w-16 h-16 rounded bg-[#202020] border border-[#ff3535] flex items-center justify-center text-[#ff3535] mb-4 shadow-xl">
          <span className="material-symbols-outlined text-3xl">videocam_off</span>
        </div>
        <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">RESTRICTED TRANSMISSION</h3>
        <p className="text-xs text-zinc-400 max-w-md mb-6 leading-relaxed">Encrypted voice and video streams are restricted exclusively to private rooms protected by MLS RFC 9420.</p>
        {onClose && <button type="button" onClick={onClose} className="px-4 py-2 bg-[#ff3535] hover:bg-[#ff5252] text-white rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors">DISCONNECT & RETURN</button>}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#272727] text-[#e5e2e1] select-none overflow-hidden font-['Hanken_Grotesk',sans-serif] ob-grid-bg">
      {/* ─ Main Stage — header removed, stage now fills entire call container */}
      <main
        ref={stageRef}
        className="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#272727]"
      >
        {/* Floating reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
          {reactions.map((r) => (
            <div key={r.id} className="absolute bottom-24 flex flex-col items-center animate-reaction-rise pointer-events-none" style={{ left: `${r.x}%` }}>
              <span className="text-3xl filter drop-shadow-md select-none">{r.emoji}</span>
              <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold bg-[#181818] border border-[#333333] px-1.5 py-0.5 rounded text-zinc-200 mt-1 uppercase">{r.senderName}</span>
            </div>
          ))}
        </div>

        {/* SPOTLIGHT */}
        {layoutMode === 'spotlight' && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-2 sm:gap-3 p-2 sm:p-3 md:p-4 overflow-hidden">
            {/* Main large stage — never squeezed */}
            <div className="flex-1 min-h-0 min-w-0 flex items-center justify-center bg-[#181818] rounded border border-[#333333] overflow-hidden relative shadow-2xl">
              {spotlightId === 'local-screenshare' ? (
                <div className="w-full h-full flex items-center justify-center bg-[#121212] relative">
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 flex items-center gap-2 px-2 sm:px-3 py-1 rounded bg-[#ff3535] text-white font-['JetBrains_Mono',monospace] font-bold text-[10px] sm:text-xs uppercase tracking-wider shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping hidden sm:inline-block" />
                    BROADCASTING DISPLAY
                    <span className="hidden sm:inline">// 1080P60</span>
                  </div>
                  <video ref={screenShareVideoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
                  {!screenStreamRef.current && (
                    <div className="flex flex-col items-center text-center p-6 sm:p-8 gap-3 sm:gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-[#202020] border border-[#ff3535] flex items-center justify-center text-[#ff3535] shadow-xl">
                        <span className="material-symbols-outlined text-2xl sm:text-3xl">screen_share</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#ff3535] uppercase tracking-widest">01 // STREAM_ACTIVE</span>
                        <h4 className="text-base sm:text-xl font-bold text-white tracking-tight">Display Stream Transmitting</h4>
                        <p className="font-['JetBrains_Mono',monospace] text-xs text-zinc-400 max-w-md">Encrypted WebRTC transport layer streaming at 60 fps.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EnccomParticipantTile
                  participant={spotlightParticipant}
                  density="large"
                  isSpotlight
                  onSpotlight={() => {}}
                  onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                  onKick={handleRemoveParticipant}
                  localVideoRef={spotlightParticipant.isLocal ? localVideoRef : undefined}
                />
              )}
            </div>

            {/* Filmstrip — responsive: mobile = horizontal rail, desktop = vertical rail */}
            {/* Mobile rail */}
            <div className="md:hidden shrink-0 h-[112px] sm:h-[132px] flex gap-2 overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-thin scrollbar-track-[#181818] scrollbar-thumb-[#333333] pb-1 -mx-1 px-1">
              {participants.map((p) => {
                if (p.id === spotlightId && spotlightId !== 'local-screenshare') return null;
                const isActive = p.id === spotlightId;
                return (
                  <button
                    key={p.id} type="button" onClick={() => setSpotlightId(p.id)}
                    className={`h-full aspect-video w-[160px] sm:w-[190px] shrink-0 snap-start rounded overflow-hidden border-2 transition-all cursor-pointer ${isActive ? 'border-[#ff3535] shadow-lg' : 'border-transparent hover:border-zinc-500'}`}
                  >
                    <EnccomParticipantTile
                      participant={p} density="tiny" isThumbnail
                      onSpotlight={() => setSpotlightId(p.id)}
                      onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                      onKick={handleRemoveParticipant}
                      localVideoRef={p.isLocal ? localVideoRef : undefined}
                    />
                  </button>
                );
              })}
            </div>
            {/* Desktop rail */}
            <div className="hidden md:flex w-[200px] lg:w-[240px] xl:w-[264px] shrink-0 flex-col gap-2.5 overflow-y-auto overflow-x-hidden pr-1.5 scrollbar-thin scrollbar-track-[#272727] scrollbar-thumb-[#333333]">
              {participants.map((p) => {
                if (p.id === spotlightId && spotlightId !== 'local-screenshare') return null;
                const isActive = p.id === spotlightId;
                return (
                  <button
                    key={p.id} type="button" onClick={() => setSpotlightId(p.id)}
                    className={`w-full aspect-video shrink-0 rounded overflow-hidden border-2 text-left transition-all cursor-pointer ${isActive ? 'border-[#ff3535] shadow-lg' : 'border-transparent hover:border-zinc-600'}`}
                  >
                    <EnccomParticipantTile
                      participant={p} density="small" isThumbnail
                      onSpotlight={() => setSpotlightId(p.id)}
                      onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                      onKick={handleRemoveParticipant}
                      localVideoRef={p.isLocal ? localVideoRef : undefined}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* GRID — adaptive, container-measured */}
        {layoutMode === 'grid' && (
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-[#272727] scrollbar-thumb-[#333333] p-2 sm:p-3 md:p-4 flex flex-col items-center">
            {/* Grid whose columns come from ResizeObserver, NOT breakpoint. Gap is dynamic too. */}
            <div
              className="w-full grid auto-rows-fr content-start"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: `${gap}px`,
                // Center single-row grids without wasting height — limit max width when few participants
                maxWidth: participants.length <= 2 ? '960px' : participants.length <= 4 ? '1100px' : '100%',
                paddingBottom: `${dockH}px`,
              }}
            >
              {paginatedParticipants.map((p) => (
                <div
                  key={p.id}
                  className="w-full aspect-video min-w-0 min-h-0 overflow-hidden rounded"
                >
                  <EnccomParticipantTile
                    participant={p}
                    density={tileDensity}
                    onSpotlight={() => { setSpotlightId(p.id); setLayoutMode('spotlight'); }}
                    onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                    onKick={handleRemoveParticipant}
                    localVideoRef={p.isLocal ? localVideoRef : undefined}
                  />
                </div>
              ))}
            </div>

            {/* Overflow / pagination bar — only when tiles would otherwise become unusably tiny */}
            {totalPages > 1 && (
              <div className="shrink-0 mt-3 flex items-center gap-2 bg-[#181818] border border-[#333333] rounded-full px-2 py-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] flex items-center justify-center text-zinc-200 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-white px-2 tabular-nums">
                  {currentPage + 1} / {totalPages}
                  <span className="hidden sm:inline text-zinc-400 font-normal"> · {participants.length} NODES</span>
                </span>
                <span className="hidden sm:inline w-px h-4 bg-[#333333]" />
                <span className="hidden sm:inline font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase tracking-wider">
                  +{participants.length - visibleCount} MORE
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed border border-[#333333] flex items-center justify-center text-zinc-200 cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            )}

            {/* Participant count footer for non-paginated overflow hint */}
            {totalPages === 1 && participants.length > 6 && (
              <div className="shrink-0 mt-3 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase tracking-widest">
                {participants.length} NODES · {columns}×{Math.ceil(paginatedParticipants.length / columns)} GRID · {tileW}×{Math.round(tileW / (16/9))} TILE
              </div>
            )}
          </div>
        )}
      </main>

      {/* Volume modal */}
      {showVolumeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowVolumeFor(null)}>
          <div className="w-[88vw] max-w-[360px] bg-[#181818] border border-[#333333] rounded p-6 shadow-2xl text-left font-['Hanken_Grotesk',sans-serif]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="flex flex-col min-w-0">
                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#ff3535] tracking-widest uppercase">AUDIO GAIN // CONFIG</span>
                <span className="font-bold text-white text-sm font-['JetBrains_Mono',monospace] truncate">{participants.find((p) => p.id === showVolumeFor)?.name}</span>
              </div>
              <button type="button" onClick={() => setShowVolumeFor(null)} className="text-zinc-400 hover:text-white cursor-pointer shrink-0 ml-3">✕</button>
            </div>
            <div className="py-5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-['JetBrains_Mono',monospace]">
                <span className="text-zinc-400 uppercase">Input Amplitude</span>
                <span className="font-bold text-[#ff3535]">{participants.find((p) => p.id === showVolumeFor)?.volume ?? 100}%</span>
              </div>
              <input type="range" min="0" max="200" value={participants.find((p) => p.id === showVolumeFor)?.volume ?? 100} onChange={(e) => handleVolumeChange(showVolumeFor, parseInt(e.target.value))} className="w-full accent-[#ff3535] cursor-pointer h-2 bg-[#272727] rounded" />
              <div className="flex justify-between text-[10px] text-zinc-500 font-['JetBrains_Mono',monospace] uppercase"><span>0% (MUTED)</span><span>100% (UNITY)</span><span>200% (BOOST)</span></div>
            </div>
            <button type="button" onClick={() => handleVolumeChange(showVolumeFor, 100)} className="w-full py-2 bg-[#202020] hover:bg-[#272727] border border-[#333333] hover:border-[#ff3535] text-xs font-['JetBrains_Mono',monospace] font-bold text-zinc-200 rounded uppercase transition-colors cursor-pointer">Reset Unity (100%)</button>
          </div>
        </div>
      )}

      {/* Stats modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4" onClick={() => setShowStatsModal(false)}>
          <div className="w-full max-w-xl bg-[#181818] border border-[#333333] rounded shadow-2xl overflow-hidden text-left max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-6 py-4 bg-[#202020] border-b border-[#333333] flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3535] shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#ff3535] tracking-widest uppercase">01 // TELECOM TELEMETRY</span>
                  <h3 className="text-white font-bold text-sm sm:text-base tracking-tight font-['Hanken_Grotesk',sans-serif] truncate">Cryptographic Packet Inspector</h3>
                </div>
              </div>
              <button type="button" onClick={() => setShowStatsModal(false)} className="text-zinc-400 hover:text-white cursor-pointer font-mono shrink-0">✕</button>
            </div>
            <div className="p-4 sm:p-6 flex flex-col gap-4 text-xs font-['JetBrains_Mono',monospace]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded border-l-2 border-l-[#ff3535]"><span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Round-Trip Latency</span><span className="text-xl font-bold text-white">{metrics.ping} MS</span><span className="text-[10px] text-zinc-500 block mt-0.5">JITTER // {metrics.jitter}MS</span></div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded border-l-2 border-l-[#10b981]"><span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Packet Integrity</span><span className="text-xl font-bold text-[#10b981]">{metrics.packetLoss}% LOSS</span><span className="text-[10px] text-zinc-500 block mt-0.5">STATUS // ZERO_DROP</span></div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded"><span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Inbound Throughput</span><span className="text-lg font-bold text-zinc-200">{metrics.bitrateIn} KBPS</span><span className="text-[10px] text-zinc-500 block mt-0.5">{metrics.resolution}</span></div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded"><span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Outbound Throughput</span><span className="text-lg font-bold text-zinc-200">{metrics.bitrateOut} KBPS</span><span className="text-[10px] text-zinc-500 block mt-0.5">SIMULCAST // ACTIVE</span></div>
              </div>
              <div className="p-4 bg-[#202020] border border-[#333333] rounded flex flex-col gap-2 text-xs">
                <div className="flex justify-between gap-2 border-b border-[#333333]/50 pb-1.5"><span className="text-zinc-400 shrink-0">Video Pipeline:</span><span className="text-white font-semibold text-right truncate">{metrics.videoCodec}</span></div>
                <div className="flex justify-between gap-2 border-b border-[#333333]/50 pb-1.5"><span className="text-zinc-400 shrink-0">Audio Pipeline:</span><span className="text-white font-semibold text-right truncate">{metrics.audioCodec}</span></div>
                <div className="flex justify-between gap-2"><span className="text-zinc-400 shrink-0">Encryption Scheme:</span><span className="text-[#ff3535] font-semibold text-right truncate">{metrics.e2eeProtocol}</span></div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-3.5 bg-[#202020] border-t border-[#333333] flex justify-between items-center gap-2">
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase truncate">RFC 9420 TREEKEM VERIFIED</span>
              <button type="button" onClick={() => setShowStatsModal(false)} className="px-4 py-2 bg-[#ff3535] hover:bg-[#ff5252] text-white font-['JetBrains_Mono',monospace] font-bold rounded text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0">Close Inspector</button>
            </div>
          </div>
        </div>
      )}

      {/* ─ Dock — responsive: icon labels hidden on mobile, wraps safely, never overflows viewport */}
      <footer
        ref={dockRef}
        className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 sm:gap-1.5 md:gap-2 bg-[#181818] border border-[#333333] px-2 sm:px-3 md:px-3.5 py-1.5 sm:py-2 md:py-2.5 rounded-full sm:rounded shadow-2xl max-w-[96vw] sm:max-w-none flex-wrap justify-center"
      >
        <button type="button" onClick={() => setIsMicMuted((v) => !v)}
          className={`relative p-2 sm:px-3 sm:py-2 rounded-full sm:rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isMicMuted ? 'bg-[#2e1616] text-[#ff3535] border-[#ff3535]' : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'}`}
          title={isMicMuted ? 'Unmute' : 'Mute'}>
          <span className="material-symbols-outlined text-[18px] sm:text-[18px]">{isMicMuted ? 'mic_off' : 'mic'}</span>
          <span className="hidden lg:inline uppercase text-[11px]">{isMicMuted ? 'MUTED' : 'MIC'}</span>
          {!isMicMuted && <span className="hidden sm:inline w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />}
        </button>

        <button type="button" onClick={handleToggleCamera}
          className={`p-2 sm:px-3 sm:py-2 rounded-full sm:rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isVideoOn ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]' : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'}`}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}>
          <span className="material-symbols-outlined text-[18px]">{isVideoOn ? 'videocam' : 'videocam_off'}</span>
          <span className="hidden lg:inline uppercase text-[11px]">{isVideoOn ? 'CAM ON' : 'CAM'}</span>
        </button>

        <button type="button" onClick={handleToggleScreenShare}
          className={`p-2 sm:px-3 sm:py-2 rounded-full sm:rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isScreenSharing ? 'bg-[#ff3535] text-white border-[#ff3535]' : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'}`}
          title={isScreenSharing ? 'Stop Share' : 'Share Screen'}>
          <span className="material-symbols-outlined text-[18px]">{isScreenSharing ? 'stop_screen_share' : 'screen_share'}</span>
          <span className="hidden lg:inline uppercase text-[11px]">DISPLAY</span>
        </button>

        <button type="button" onClick={() => setIsDeafened((v) => !v)}
          className={`p-2 sm:px-3 sm:py-2 rounded-full sm:rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isDeafened ? 'bg-[#2e1616] text-[#ff3535] border-[#ff3535]' : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'}`}
          title={isDeafened ? 'Undeafen' : 'Deafen'}>
          <span className="material-symbols-outlined text-[18px]">{isDeafened ? 'headset_off' : 'headphones'}</span>
          <span className="hidden lg:inline uppercase text-[11px]">{isDeafened ? 'DEAF' : 'AUDIO'}</span>
        </button>

        {/* Layout toggle — migrated from removed header */}
        <button type="button" onClick={() => setLayoutMode((m) => (m === 'grid' ? 'spotlight' : 'grid'))}
          className="p-2 sm:px-3 sm:py-2 rounded-full sm:rounded bg-[#202020] text-zinc-200 border border-[#333333] hover:border-zinc-400 transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold"
          title={layoutMode === 'grid' ? 'Switch to Focus view' : 'Switch to Grid view'}>
          <span className="material-symbols-outlined text-[18px]">{layoutMode === 'grid' ? 'view_carousel' : 'grid_view'}</span>
          <span className="hidden lg:inline uppercase text-[11px]">{layoutMode === 'grid' ? 'FOCUS' : 'GRID'}</span>
        </button>

        {/* Stats — migrated from removed header */}
        <button type="button" onClick={() => setShowStatsModal(true)}
          className="p-2 rounded-full sm:rounded bg-[#202020] text-zinc-200 border border-[#333333] hover:border-zinc-400 transition-all cursor-pointer"
          title="Telemetry Stats">
          <span className="material-symbols-outlined text-[18px]">query_stats</span>
        </button>

        {/* Debug: add node — migratd from removed header, hidden on very small screens */}
        <button type="button" onClick={handleAddParticipant}
          className="hidden sm:flex p-2 sm:px-2.5 sm:py-2 rounded-full sm:rounded bg-[#202020] hover:bg-[#2a2a2a] text-zinc-400 hover:text-white border border-[#333333] transition-all cursor-pointer"
          title="Simulate Peer Connection">
          <span className="material-symbols-outlined text-[18px]">person_add</span>
        </button>

        <div className="relative">
          <button type="button" onClick={() => setShowReactionsMenu((v) => !v)}
            className="p-2 rounded-full sm:rounded bg-[#202020] text-zinc-200 border border-[#333333] hover:border-zinc-400 transition-all cursor-pointer"
            title="Reaction">
            <span className="material-symbols-outlined text-[18px]">add_reaction</span>
          </button>
          {showReactionsMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#181818] border border-[#333333] rounded p-1.5 flex items-center gap-1 shadow-2xl">
              {['🔥', '⚡', '🔒', '🛡️', '❤️', '👏', '🚀'].map((emoji) => (
                <button key={emoji} type="button" onClick={() => handleTriggerReaction(emoji)} className="w-9 h-9 rounded hover:bg-[#272727] flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer">{emoji}</button>
              ))}
            </div>
          )}
        </div>

        {onToggleChat && (
          <button type="button" onClick={onToggleChat}
            className={`p-2 sm:px-3 sm:py-2 rounded-full sm:rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isChatOpen ? 'bg-[#ff3535] text-white border-[#ff3535]' : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'}`}
            title={isChatOpen ? 'Close Chat' : 'Open Chat'}>
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span className="hidden lg:inline uppercase text-[11px]">CHAT</span>
          </button>
        )}

        <div className="hidden sm:block w-px h-6 bg-[#333333] mx-1" />

        <button type="button" onClick={onClose}
          className="px-3 sm:px-4 py-2 rounded-full sm:rounded bg-[#ff3535] hover:bg-[#ff5252] text-white flex items-center gap-1.5 font-['JetBrains_Mono',monospace] font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer border border-[#ff3535] shrink-0"
          title="Disconnect">
          <span className="material-symbols-outlined text-[18px]">call_end</span>
          <span className="hidden xs:inline">LEAVE</span>
          <span className="hidden sm:inline">DISCONNECT</span>
        </button>
      </footer>
    </div>
  );
};

// =============================================================================
// Participant tile — density-aware (tile size, NOT viewport). Long names truncate.
// =============================================================================
type TileDensity = 'large' | 'medium' | 'small' | 'tiny';
interface EnccomParticipantTileProps {
  participant: CallParticipant;
  density?: TileDensity;
  isSpotlight?: boolean;
  isThumbnail?: boolean;
  onSpotlight: () => void;
  onVolumeClick: (id: string) => void;
  onKick: (id: string) => void;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

const EnccomParticipantTile: React.FC<EnccomParticipantTileProps> = ({
  participant,
  density = 'medium',
  isSpotlight = false,
  isThumbnail = false,
  onSpotlight,
  onVolumeClick,
  onKick,
  localVideoRef,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showTapMenu, setShowTapMenu] = useState(false);
  const isSpeakingNow = participant.isSpeaking && !participant.isMuted;

  // Map density → internal sizing; spotlight always large
  const effective: TileDensity = isSpotlight ? 'large' : isThumbnail ? 'tiny' : density;
  const isCompact = effective === 'small' || effective === 'tiny';
  const isTiny = effective === 'tiny';

  const borderClass = isSpeakingNow
    ? 'border-2 border-[#10b981] shadow-[0_0_18px_rgba(16,185,129,0.22)]'
    : 'border border-[#333333] hover:border-zinc-500';

  // touch helper: tap tile toggles menu (unless thumbnail where tap = spotlight)
  const handleTileClick = () => {
    if (isThumbnail) return; // parent button handles spotlight
    // On touch devices, first tap opens menu; second tap could spotlight. But keep simple:
    // If compact, tap shows menu; desktop hover already shows it.
    if (isCompact || typeof window !== 'undefined' && 'ontouchstart' in window) {
      setShowTapMenu((v) => !v);
    }
  };

  const showActions = (isHovered && !isThumbnail) || (showTapMenu && !isThumbnail);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleTileClick}
      // container query-style: isolate tile
      style={{ containerType: 'inline-size' } as React.CSSProperties}
      className={`relative w-full h-full rounded bg-[#181818] overflow-hidden flex items-center justify-center transition-all duration-200 group ${borderClass} ${!isThumbnail ? 'cursor-pointer' : ''}`}
    >
      {/* Corner reticles — hide on tiny */}
      {!isTiny && (
        <>
          <span className="absolute top-1 left-1.5 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">+</span>
          <span className="absolute top-1 right-1.5 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">+</span>
          <span className="absolute bottom-1 left-1.5 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">+</span>
          <span className="absolute bottom-1 right-1.5 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">+</span>
        </>
      )}

      {/* Video / avatar */}
      {participant.isVideoOn ? (
        <div className="w-full h-full relative bg-[#121212]">
          {participant.isLocal ? (
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1c1c1c] to-[#242424] flex items-center justify-center relative">
              <div className="text-center flex flex-col items-center gap-1.5">
                <div className={`${isTiny ? 'w-8 h-8 text-[10px]' : isCompact ? 'w-10 h-10 text-xs' : 'w-14 h-14 text-lg'} rounded border border-[#333333] bg-[#272727] flex items-center justify-center shadow-lg`}>
                  <span className="font-['JetBrains_Mono',monospace] font-bold text-white">{participant.name.slice(0, 2).toUpperCase()}</span>
                </div>
                {!isTiny && <span className="font-['JetBrains_Mono',monospace] text-[9px] text-zinc-500 uppercase tracking-widest hidden sm:inline">STREAM // 1080P_60</span>}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#181818] p-2 sm:p-3">
          <div className={`flex items-center justify-center gap-1 ${isTiny ? 'mb-1.5' : 'gap-1.5 mb-2 sm:mb-3'}`}>
            {[1, 2, 3, 4, 5].map((bar) => (
              <span
                key={bar}
                className={`w-0.5 sm:w-1 rounded-xs transition-all duration-150 ${isSpeakingNow ? 'bg-[#10b981] animate-bounce' : 'bg-[#333333] h-2'}`}
                style={{ height: isSpeakingNow ? `${isTiny ? 8 + (bar % 3) * 6 : 10 + (bar % 3) * 8}px` : '6px', animationDelay: `${bar * 0.1}s` }}
              />
            ))}
          </div>
          <div
            className={`border bg-[#202020] rounded flex items-center justify-center font-['JetBrains_Mono',monospace] font-bold text-white shadow-xl shrink-0
              ${isTiny ? 'w-8 h-8 text-[10px]' : isCompact ? 'w-10 h-10 text-xs' : isSpotlight ? 'w-20 h-20 sm:w-24 sm:h-24 text-xl sm:text-2xl' : 'w-14 h-14 text-base'}
              ${isSpeakingNow ? 'border-[#10b981]' : 'border-[#333333]'}`}
          >
            {participant.name.slice(0, 2).toUpperCase()}
          </div>
          {!isTiny && !isThumbnail && (
            <div className={`mt-2 flex flex-col items-center gap-0.5 ${isCompact ? 'hidden sm:flex' : ''}`}>
              <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff3535] font-bold tracking-widest uppercase truncate max-w-[14ch]">{participant.role || 'PEER_NODE'}</span>
              {!isCompact && <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase tracking-wider">{isSpeakingNow ? 'TRANSMITTING VOICE' : 'CARRIER STANDBY'}</span>}
            </div>
          )}
        </div>
      )}

      {/* Top actions — hover on desktop, tap on touch */}
      {showActions && (
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 z-20 flex items-center gap-1 bg-[#181818]/90 border border-[#333333] p-1 rounded backdrop-blur-sm">
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowTapMenu(false); onSpotlight(); }}
            className="p-1 rounded hover:bg-[#272727] text-zinc-300 hover:text-white transition-colors cursor-pointer" title="Focus">
            <span className="material-symbols-outlined text-[15px]">pin_invoke</span>
          </button>
          {!participant.isLocal && (
            <>
              <button type="button" onClick={(e) => { e.stopPropagation(); onVolumeClick(participant.id); setShowTapMenu(false); }}
                className="p-1 rounded hover:bg-[#272727] text-zinc-300 hover:text-white transition-colors cursor-pointer" title="Gain">
                <span className="material-symbols-outlined text-[15px]">volume_up</span>
              </button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onKick(participant.id); }}
                className="p-1 rounded hover:bg-[#2e1616] text-zinc-300 hover:text-[#ff3535] transition-colors cursor-pointer" title="Remove">
                <span className="material-symbols-outlined text-[15px]">person_remove</span>
              </button>
            </>
          )}
          {/* close for tap menu */}
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowTapMenu(false); setIsHovered(false); }}
            className="sm:hidden p-1 rounded hover:bg-[#272727] text-zinc-400 hover:text-white cursor-pointer">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {/* Tap affordance hint on compact tiles (only when menu closed) */}
      {isCompact && !isThumbnail && !showActions && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowTapMenu(true); }}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-[#181818]/80 border border-[#333333] flex items-center justify-center text-zinc-400 hover:text-white sm:hidden"
        >
          <span className="material-symbols-outlined text-[14px]">more_vert</span>
        </button>
      )}

      {/* Bottom identity bar — always constrained, never overflows, truncates long names */}
      <div className={`absolute left-1 right-1 sm:left-2 sm:right-2 z-10 flex items-center justify-between gap-1 pointer-events-none ${isTiny ? 'bottom-1' : 'bottom-1.5 sm:bottom-2'}`}>
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-1 bg-[#181818]/90 border border-[#333333]/80 px-1.5 sm:px-2 py-1 rounded backdrop-blur-sm pointer-events-auto overflow-hidden">
          <span className={`font-['JetBrains_Mono',monospace] font-bold text-white tracking-wide truncate min-w-0 ${isTiny ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>
            {participant.name.trim()}
          </span>
          {participant.role && !isTiny && (
            <span className={`font-['JetBrains_Mono',monospace] text-[#ff3535] font-bold uppercase tracking-wider shrink-0 hidden sm:inline ${isCompact ? 'text-[8px]' : 'text-[9px]'}`}>
              {participant.role}
            </span>
          )}
        </div>
        <div className={`flex items-center gap-1 bg-[#181818]/90 border border-[#333333]/80 px-1.5 py-1 rounded backdrop-blur-sm pointer-events-auto shrink-0 ${isTiny ? 'hidden' : 'flex'}`}>
          {participant.isMuted && <span className="material-symbols-outlined text-[#ff3535] text-[14px]">mic_off</span>}
          {participant.isDeafened && <span className="material-symbols-outlined text-[#ff3535] text-[14px]">headset_off</span>}
          {/* signal — hide on tiny, compact shows 2 bars */}
          <div className={`flex items-end gap-0.5 h-3 ${isCompact ? 'hidden sm:flex' : 'flex'} pl-0.5`} title={`Signal ${participant.signalStrength}`}>
            <span className="w-0.5 h-1.5 bg-[#10b981]" />
            <span className={`w-0.5 h-2.5 ${participant.signalStrength >= 2 ? 'bg-[#10b981]' : 'bg-[#333333]'}`} />
            <span className={`w-0.5 h-3.5 hidden sm:inline-block ${participant.signalStrength === 3 ? 'bg-[#10b981]' : 'bg-[#333333]'}`} />
          </div>
          {/* speaking dot */}
          {isSpeakingNow && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse hidden sm:inline-block" />}
        </div>
        {/* tiny: minimal mute dot */}
        {isTiny && participant.isMuted && (
          <span className="w-5 h-5 rounded bg-[#2e1616] border border-[#ff3535]/40 flex items-center justify-center shrink-0 pointer-events-auto">
            <span className="material-symbols-outlined text-[#ff3535] text-[12px]">mic_off</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
