import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CallParticipant, CallLayoutMode, TelecomMetrics, FloatingReaction } from './callTypes';

interface VideoCallProps {
  roomId: string;
  isPrivateRoom?: boolean;
  myId?: string | null;
  onClose?: () => void;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
}

export const VideoCall: React.FC<VideoCallProps> = ({
  roomId,
  isPrivateRoom = false,
  myId = 'local-user',
  onClose,
  onToggleChat,
  isChatOpen = false,
}) => {
  // Call state
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
  const [callDuration, setCallDuration] = useState(0);

  // Local media stream refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // Mock participants initialized with Discord-like avatars and state
  const [participants, setParticipants] = useState<CallParticipant[]>([
    {
      id: myId || 'user-local',
      name: `You (${(myId || 'anon').slice(0, 6)})`,
      isLocal: true,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 0,
      volume: 100,
      signalStrength: 3,
      role: 'Member',
      avatarColor: '#ff3535',
    },
    {
      id: 'peer-alex-92',
      name: 'Alex [Cryptographer]',
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: true,
      isSpeaking: true,
      audioLevel: 75,
      volume: 100,
      signalStrength: 3,
      role: 'Owner',
      avatarColor: '#5865F2',
    },
    {
      id: 'peer-elena-44',
      name: 'Elena Rostova',
      isLocal: false,
      isMuted: true,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 0,
      volume: 85,
      signalStrength: 2,
      role: 'Admin',
      avatarColor: '#23a55a',
    },
    {
      id: 'peer-cipher-10',
      name: 'ZeroKnowledge',
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: false,
      isSpeaking: false,
      audioLevel: 20,
      volume: 110,
      signalStrength: 3,
      role: 'Member',
      avatarColor: '#f59e0b',
    },
  ]);

  // Live Telecom Quality Metrics (Simulated WebRTC stats)
  const [metrics, setMetrics] = useState<TelecomMetrics>({
    ping: 18,
    jitter: 2,
    packetLoss: 0.0,
    bitrateIn: 2450,
    bitrateOut: 1820,
    videoCodec: 'VP9 (Profile 0)',
    audioCodec: 'Opus 48kHz Stereo (E2EE SFrame)',
    resolution: '1920x1080@30fps',
    e2eeProtocol: isPrivateRoom ? 'MLS RFC 9420 (Ratchet Epoch 7)' : 'Plaintext Transport',
  });

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format call duration MM:SS
  const formattedDuration = useMemo(() => {
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Random speech animation to simulate active conversation speaking rings
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.isLocal) {
            return {
              ...p,
              isMuted: isMicMuted,
              isDeafened: isDeafened,
              isVideoOn: isVideoOn,
              isScreenSharing: isScreenSharing,
            };
          }
          if (p.isMuted) {
            return { ...p, isSpeaking: false, audioLevel: 0 };
          }
          // Random speaking toggle for realistic Discord call demo
          const shouldSpeak = Math.random() > 0.45;
          return {
            ...p,
            isSpeaking: shouldSpeak,
            audioLevel: shouldSpeak ? Math.floor(Math.random() * 80 + 20) : 0,
          };
        })
      );

      // Slightly fluctuate telecom ping
      setMetrics((m) => ({
        ...m,
        ping: Math.floor(16 + Math.random() * 8),
        bitrateIn: Math.floor(2200 + Math.random() * 400),
      }));
    }, 1800);

    return () => clearInterval(interval);
  }, [isMicMuted, isDeafened, isVideoOn, isScreenSharing]);

  // Handle local camera toggle with real WebRTC getUserMedia attempt
  const handleToggleCamera = async () => {
    if (isVideoOn) {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setIsVideoOn(false);
      setParticipants((prev) =>
        prev.map((p) => (p.isLocal ? { ...p, isVideoOn: false, stream: null } : p))
      );
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setIsVideoOn(true);
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, isVideoOn: true, stream } : p))
        );
      } catch (err) {
        console.warn('Camera access denied or unavailable, using mock video feed', err);
        // Fallback to active mock state
        setIsVideoOn(true);
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, isVideoOn: true } : p))
        );
      }
    }
  };

  // Handle screen share toggle
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      if (spotlightId === 'local-screenshare') {
        setSpotlightId(null);
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
        }
        setIsScreenSharing(true);
        setLayoutMode('spotlight');
        setSpotlightId('local-screenshare');

        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setSpotlightId(null);
        };
      } catch {
        // Mock screen share mode if cancelled
        setIsScreenSharing(true);
        setLayoutMode('spotlight');
        setSpotlightId('local-screenshare');
      }
    }
  };

  // Trigger floating reaction burst
  const handleTriggerReaction = (emoji: string) => {
    const newReaction: FloatingReaction = {
      id: Math.random().toString(),
      emoji,
      senderName: 'You',
      x: Math.floor(20 + Math.random() * 60),
    };
    setReactions((prev) => [...prev, newReaction]);
    setShowReactionsMenu(false);

    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
    }, 2800);
  };

  // Add / remove demo participant for UI testing
  const handleAddParticipant = () => {
    const id = `peer-guest-${Math.floor(Math.random() * 900 + 100)}`;
    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f97316'];
    const newPeer: CallParticipant = {
      id,
      name: `Guest_${id.slice(-3)}`,
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: Math.random() > 0.5,
      isSpeaking: false,
      audioLevel: 0,
      volume: 100,
      signalStrength: 3,
      role: 'Guest',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
    setParticipants((prev) => [...prev, newPeer]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    if (spotlightId === id) setSpotlightId(null);
  };

  // Update per-user volume
  const handleVolumeChange = (id: string, vol: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, volume: vol } : p))
    );
  };

  // Determine grid columns dynamically based on participant count
  const gridLayoutClass = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1 max-w-2xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-6xl';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  }, [participants.length]);

  // Spotlight participant object
  const spotlightParticipant = useMemo(() => {
    if (spotlightId === 'local-screenshare') {
      return {
        id: 'local-screenshare',
        name: 'Your Screen Broadcast',
        isLocal: true,
        isMuted: false,
        isVideoOn: true,
        isScreenSharing: true,
        isSpeaking: false,
        volume: 100,
        signalStrength: 3 as const,
      };
    }
    return participants.find((p) => p.id === spotlightId) || participants[0];
  }, [spotlightId, participants]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#111214] text-zinc-200 select-none overflow-hidden font-sans">
      {/* 1. Discord Voice Header Bar */}
      <header className="h-14 shrink-0 px-4 md:px-6 bg-[#18191c] border-b border-[#2b2d31] flex items-center justify-between z-30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#23a55a] text-[20px] animate-pulse">
              sensors
            </span>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm tracking-wide font-mono">
                  #{roomId}
                </span>
                {isPrivateRoom ? (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    MLS E2EE
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                    Public Room
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                <span className="text-[#23a55a] font-medium">Voice Connected</span>
                <span>•</span>
                <span className="font-mono text-zinc-400">{metrics.ping}ms</span>
                <span>•</span>
                <span className="font-mono text-zinc-400">{formattedDuration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Layout Mode Switcher */}
          <div className="bg-[#2b2d31] p-0.5 rounded-lg flex items-center text-xs">
            <button
              type="button"
              onClick={() => {
                setLayoutMode('grid');
                setSpotlightId(null);
              }}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                layoutMode === 'grid'
                  ? 'bg-[#35373c] text-white font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View (All participants equal)"
            >
              <span className="material-symbols-outlined text-[16px]">grid_view</span>
              <span className="hidden md:inline">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutMode('spotlight');
                if (!spotlightId) setSpotlightId(participants[1]?.id || participants[0]?.id);
              }}
              className={`px-2.5 py-1 rounded flex items-center gap-1 transition-all ${
                layoutMode === 'spotlight'
                  ? 'bg-[#35373c] text-white font-semibold shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Spotlight View (Featured speaker)"
            >
              <span className="material-symbols-outlined text-[16px]">view_sidebar</span>
              <span className="hidden md:inline">Focus</span>
            </button>
          </div>

          {/* Add Demo Participant Button (For testing) */}
          <button
            type="button"
            onClick={handleAddParticipant}
            className="p-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 hover:text-white transition-colors"
            title="Add Simulated Participant (UI Demo)"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
          </button>

          {/* WebRTC Stats Inspector Toggle */}
          <button
            type="button"
            onClick={() => setShowStatsModal((v) => !v)}
            className={`p-1.5 rounded-lg transition-colors ${
              showStatsModal
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 hover:text-white'
            }`}
            title="Telecom WebRTC Stream Metrics"
          >
            <span className="material-symbols-outlined text-[18px]">network_check</span>
          </button>

          {/* Toggle Chat Sidebar */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className={`p-1.5 rounded-lg transition-colors ${
                isChatOpen
                  ? 'bg-[#5865F2] text-white'
                  : 'bg-[#2b2d31] hover:bg-[#35373c] text-zinc-300 hover:text-white'
              }`}
              title="Toggle In-Call Chat"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </button>
          )}

          {/* Minimize / Close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#2b2d31] hover:bg-[#da373c] hover:text-white text-zinc-400 transition-colors"
              title="Leave / Minimize Call"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Main Video Call Stage */}
      <main className="flex-1 min-h-0 relative p-3 md:p-6 flex flex-col items-center justify-center overflow-y-auto">
        {/* Floating Animated Reactions */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-24 flex flex-col items-center animate-reaction-rise pointer-events-none"
              style={{ left: `${r.x}%` }}
            >
              <span className="text-4xl filter drop-shadow-md select-none">{r.emoji}</span>
              <span className="text-[10px] font-semibold bg-black/60 px-1.5 py-0.5 rounded text-zinc-200 mt-1">
                {r.senderName}
              </span>
            </div>
          ))}
        </div>

        {/* LAYOUT A: SPOTLIGHT / FOCUSED MODE */}
        {layoutMode === 'spotlight' && (
          <div className="w-full h-full max-w-7xl flex flex-col md:flex-row gap-4 pb-20">
            {/* Featured Center Stage */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-[#1e1f22] rounded-2xl border border-[#2b2d31] overflow-hidden relative shadow-2xl">
              {spotlightId === 'local-screenshare' ? (
                <div className="w-full h-full flex items-center justify-center bg-zinc-950 relative">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600/90 text-white font-bold text-xs shadow-lg tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    LIVE SCREEN SHARE
                  </div>
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  {!screenStreamRef.current && (
                    <div className="flex flex-col items-center text-center p-6 gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white shadow-xl">
                        <span className="material-symbols-outlined text-3xl">screen_share</span>
                      </div>
                      <h4 className="text-lg font-bold text-white">Broadcasting Your Screen</h4>
                      <p className="text-xs text-zinc-400 max-w-md">
                        1080p60 WebRTC stream broadcasted with End-to-End Encryption.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <ParticipantTile
                  participant={spotlightParticipant}
                  isSpotlight
                  onSpotlight={() => {}}
                  onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                  onKick={handleRemoveParticipant}
                  localVideoRef={spotlightParticipant.isLocal ? localVideoRef : undefined}
                />
              )}
            </div>

            {/* Thumbnail Filmstrip (Right Column / Top Reel on Mobile) */}
            <div className="w-full md:w-64 shrink-0 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pr-1">
              {participants.map((p) => {
                if (p.id === spotlightId && spotlightId !== 'local-screenshare') return null;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSpotlightId(p.id)}
                    className="w-48 md:w-full aspect-video shrink-0 cursor-pointer hover:ring-2 hover:ring-indigo-500 rounded-xl transition-all"
                  >
                    <ParticipantTile
                      participant={p}
                      isThumbnail
                      onSpotlight={() => setSpotlightId(p.id)}
                      onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                      onKick={handleRemoveParticipant}
                      localVideoRef={p.isLocal ? localVideoRef : undefined}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LAYOUT B: BALANCED GRID MODE */}
        {layoutMode === 'grid' && (
          <div className={`w-full h-full grid gap-3 md:gap-4 auto-rows-fr items-center justify-center pb-20 ${gridLayoutClass}`}>
            {participants.map((p) => (
              <div key={p.id} className="w-full h-full min-h-[160px] max-h-[360px] aspect-video">
                <ParticipantTile
                  participant={p}
                  onSpotlight={() => {
                    setSpotlightId(p.id);
                    setLayoutMode('spotlight');
                  }}
                  onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                  onKick={handleRemoveParticipant}
                  localVideoRef={p.isLocal ? localVideoRef : undefined}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. Per-User Volume Popover */}
      {showVolumeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4" onClick={() => setShowVolumeFor(null)}>
          <div
            className="w-80 bg-[#1e1f22] border border-[#2b2d31] rounded-2xl p-5 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2b2d31]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400">volume_up</span>
                <span className="font-bold text-white text-sm">
                  {participants.find((p) => p.id === showVolumeFor)?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowVolumeFor(null)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="py-4 flex flex-col gap-3">
              <div className="flex justify-between text-xs text-zinc-300">
                <span>User Volume</span>
                <span className="font-mono font-bold text-indigo-400">
                  {participants.find((p) => p.id === showVolumeFor)?.volume ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={participants.find((p) => p.id === showVolumeFor)?.volume ?? 100}
                onChange={(e) => handleVolumeChange(showVolumeFor, parseInt(e.target.value))}
                className="w-full accent-[#5865F2] cursor-pointer h-2 bg-zinc-700 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>0% (Mute)</span>
                <span>100% (Standard)</span>
                <span>200% (Boost)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleVolumeChange(showVolumeFor, 100)}
              className="w-full py-2 bg-[#2b2d31] hover:bg-[#35373c] text-xs font-semibold text-zinc-200 rounded-lg transition-colors"
            >
              Reset to 100%
            </button>
          </div>
        </div>
      )}

      {/* 4. Telecom WebRTC Network Stats Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowStatsModal(false)}>
          <div
            className="w-full max-w-lg bg-[#18191c] border border-[#2b2d31] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-[#1e1f22] border-b border-[#2b2d31] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">query_stats</span>
                <h3 className="text-white font-bold text-base">WebRTC Telecom Diagnostic</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#232428] border border-[#2b2d31]">
                  <span className="text-zinc-400 text-[10px] uppercase block">Round-Trip Latency</span>
                  <span className="text-lg font-bold text-emerald-400">{metrics.ping} ms</span>
                  <span className="text-[10px] text-zinc-500 block">Jitter: {metrics.jitter}ms</span>
                </div>
                <div className="p-3 rounded-xl bg-[#232428] border border-[#2b2d31]">
                  <span className="text-zinc-400 text-[10px] uppercase block">Packet Loss</span>
                  <span className="text-lg font-bold text-zinc-200">{metrics.packetLoss}%</span>
                  <span className="text-[10px] text-emerald-500 block">Status: Optimal</span>
                </div>
                <div className="p-3 rounded-xl bg-[#232428] border border-[#2b2d31]">
                  <span className="text-zinc-400 text-[10px] uppercase block">Inbound Bandwidth</span>
                  <span className="text-lg font-bold text-zinc-200">{metrics.bitrateIn} kbps</span>
                  <span className="text-[10px] text-zinc-500 block">Resolution: {metrics.resolution}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#232428] border border-[#2b2d31]">
                  <span className="text-zinc-400 text-[10px] uppercase block">Outbound Bandwidth</span>
                  <span className="text-lg font-bold text-zinc-200">{metrics.bitrateOut} kbps</span>
                  <span className="text-[10px] text-zinc-500 block">Adaptive Bitrate: ON</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#232428] border border-[#2b2d31] flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Video Pipeline:</span>
                  <span className="text-zinc-200 font-semibold">{metrics.videoCodec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Audio Pipeline:</span>
                  <span className="text-zinc-200 font-semibold">{metrics.audioCodec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">E2EE Security:</span>
                  <span className="text-emerald-400 font-semibold">{metrics.e2eeProtocol}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-[#1e1f22] border-t border-[#2b2d31] flex justify-end">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Discord Signature Floating Bottom Control Dock */}
      <footer className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 md:gap-3 bg-[#111214]/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#2b2d31] shadow-2xl">
        {/* Microphones Button */}
        <button
          type="button"
          onClick={() => setIsMicMuted((v) => !v)}
          className={`relative p-3 rounded-xl transition-all cursor-pointer ${
            isMicMuted
              ? 'bg-[#da373c] text-white hover:bg-[#b82e34]'
              : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
          }`}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isMicMuted ? 'mic_off' : 'mic'}
          </span>
          {/* Audio level indicator dot */}
          {!isMicMuted && (
            <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
          )}
        </button>

        {/* Video Camera Toggle */}
        <button
          type="button"
          onClick={handleToggleCamera}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isVideoOn
              ? 'bg-[#23a55a] text-white hover:bg-[#1f9250]'
              : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
          }`}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isVideoOn ? 'videocam' : 'videocam_off'}
          </span>
        </button>

        {/* Screen Share Toggle */}
        <button
          type="button"
          onClick={handleToggleScreenShare}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isScreenSharing
              ? 'bg-[#5865F2] text-white shadow-lg ring-2 ring-indigo-400/40'
              : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
          }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Your Screen'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
          </span>
        </button>

        {/* Deafen Toggle */}
        <button
          type="button"
          onClick={() => setIsDeafened((v) => !v)}
          className={`p-3 rounded-xl transition-all cursor-pointer ${
            isDeafened
              ? 'bg-[#da373c] text-white'
              : 'bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white'
          }`}
          title={isDeafened ? 'Undeafen' : 'Deafen (Mute Sound)'}
        >
          <span className="material-symbols-outlined text-[22px]">
            {isDeafened ? 'headset_off' : 'headphones'}
          </span>
        </button>

        {/* Emoji Reactions Trigger & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactionsMenu((v) => !v)}
            className="p-3 rounded-xl bg-[#2b2d31] text-zinc-200 hover:bg-[#35373c] hover:text-white transition-all cursor-pointer"
            title="Send Emoji Reaction"
          >
            <span className="material-symbols-outlined text-[22px]">add_reaction</span>
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#1e1f22] border border-[#2b2d31] rounded-xl p-2 flex items-center gap-1 shadow-2xl animate-in zoom-in-95 duration-100">
              {['🔥', '❤️', '👏', '😂', '🎉', '🚀', '💯'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleTriggerReaction(emoji)}
                  className="w-9 h-9 rounded-lg hover:bg-[#2b2d31] flex items-center justify-center text-xl transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#2b2d31] mx-0.5" />

        {/* Disconnect / Hang Up Button (Discord Red) */}
        <button
          type="button"
          onClick={onClose}
          className="p-3 px-5 rounded-xl bg-[#da373c] hover:bg-[#b82e34] text-white flex items-center gap-2 font-bold text-sm shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Disconnect from Voice Call"
        >
          <span className="material-symbols-outlined text-[22px]">call_end</span>
          <span className="hidden sm:inline">Leave</span>
        </button>
      </footer>
    </div>
  );
};

// ==========================================
// Subcomponent: Individual Participant Tile
// ==========================================
interface ParticipantTileProps {
  participant: CallParticipant;
  isSpotlight?: boolean;
  isThumbnail?: boolean;
  onSpotlight: () => void;
  onVolumeClick: (id: string) => void;
  onKick: (id: string) => void;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

const ParticipantTile: React.FC<ParticipantTileProps> = ({
  participant,
  isSpotlight = false,
  isThumbnail = false,
  onSpotlight,
  onVolumeClick,
  onKick,
  localVideoRef,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Determine active speaker border ring glow (Discord emerald green #23a55a)
  const isSpeakingNow = participant.isSpeaking && !participant.isMuted;
  const borderRingClass = isSpeakingNow
    ? 'ring-3 ring-[#23a55a] shadow-[0_0_20px_rgba(35,165,90,0.45)]'
    : 'border border-[#2b2d31]';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full rounded-2xl bg-[#1e1f22] overflow-hidden flex items-center justify-center transition-all duration-200 group ${borderRingClass}`}
    >
      {/* 1. Video Layer or Avatar Fallback */}
      {participant.isVideoOn ? (
        <div className="w-full h-full relative bg-zinc-950">
          {participant.isLocal ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative">
              {/* Simulated remote video stream */}
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full border-2 border-indigo-500/40 overflow-hidden shadow-lg">
                  <div
                    className="w-full h-full flex items-center justify-center font-bold text-2xl text-white"
                    style={{ backgroundColor: participant.avatarColor || '#5865F2' }}
                  >
                    {participant.name.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <span className="text-xs text-zinc-400 font-mono">Camera HD 1080p</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Video Off Avatar Experience */
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-radial from-[#2b2d31]/50 to-[#1e1f22]">
          {/* Pulsing audio wave rings when talking */}
          {isSpeakingNow && (
            <>
              <div className="absolute w-28 h-28 rounded-full border border-[#23a55a]/30 animate-ping" />
              <div className="absolute w-36 h-36 rounded-full border border-[#23a55a]/20 animate-pulse" />
            </>
          )}

          {/* Discord-style Avatar */}
          <div
            className={`relative rounded-full flex items-center justify-center font-bold text-white shadow-xl transition-transform ${
              isThumbnail ? 'w-10 h-10 text-sm' : isSpotlight ? 'w-28 h-28 text-3xl' : 'w-20 h-20 text-xl'
            } ${isSpeakingNow ? 'scale-110' : ''}`}
            style={{ backgroundColor: participant.avatarColor || '#5865F2' }}
          >
            {participant.name.slice(0, 2).toUpperCase()}

            {/* Speaking equalizer bars badge */}
            {isSpeakingNow && (
              <div className="absolute -bottom-1 -right-1 bg-[#1e1f22] p-1 rounded-full border border-[#23a55a]">
                <div className="flex items-end gap-0.5 h-3 px-1">
                  <span className="w-1 bg-[#23a55a] rounded h-2 animate-bounce" />
                  <span className="w-1 bg-[#23a55a] rounded h-3 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 bg-[#23a55a] rounded h-1.5 animate-bounce [animation-delay:0.3s]" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Top-Right Tile Quick Actions (On Hover) */}
      {isHovered && !isThumbnail && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 animate-in fade-in duration-150">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSpotlight();
            }}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
            title="Pin / Focus Participant"
          >
            <span className="material-symbols-outlined text-[16px]">pin_invoke</span>
          </button>

          {!participant.isLocal && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVolumeClick(participant.id);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                title="Adjust Participant Volume"
              >
                <span className="material-symbols-outlined text-[16px]">volume_up</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onKick(participant.id);
                }}
                className="p-1.5 rounded-lg hover:bg-red-500/20 text-zinc-300 hover:text-red-400 transition-colors"
                title="Disconnect Participant"
              >
                <span className="material-symbols-outlined text-[16px]">person_remove</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 3. Bottom Nameplate & Status Overlay */}
      <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center justify-between pointer-events-none">
        {/* Name Badge */}
        <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 max-w-[80%] pointer-events-auto">
          <span className="text-xs font-semibold text-white truncate">
            {participant.name}
          </span>
          {participant.role && (
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300">
              {participant.role}
            </span>
          )}
        </div>

        {/* Status Indicators (Mic off, Deafen, Connection Signal) */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 pointer-events-auto">
          {participant.isMuted && (
            <span className="material-symbols-outlined text-[#da373c] text-[15px]" title="Muted">
              mic_off
            </span>
          )}
          {participant.isDeafened && (
            <span className="material-symbols-outlined text-[#da373c] text-[15px]" title="Deafened">
              headset_off
            </span>
          )}
          {/* Signal Quality Bars */}
          <div
            className="flex items-end gap-0.5 h-3.5 pl-1"
            title={`Signal: ${participant.signalStrength === 3 ? 'Excellent' : 'Good'}`}
          >
            <span className="w-0.5 h-1.5 rounded-xs bg-[#23a55a]" />
            <span
              className={`w-0.5 h-2.5 rounded-xs ${
                participant.signalStrength >= 2 ? 'bg-[#23a55a]' : 'bg-zinc-600'
              }`}
            />
            <span
              className={`w-0.5 h-3.5 rounded-xs ${
                participant.signalStrength === 3 ? 'bg-[#23a55a]' : 'bg-zinc-600'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
