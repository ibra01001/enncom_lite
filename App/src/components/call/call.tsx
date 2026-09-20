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

  // Participants matching Enccom's cryptographic / telecom identity aesthetic
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

  // Live Telecom Quality Metrics (Simulated WebRTC stats matching Enccom Packet Inspector)
  const [metrics, setMetrics] = useState<TelecomMetrics>({
    ping: 18,
    jitter: 2,
    packetLoss: 0.0,
    bitrateIn: 2450,
    bitrateOut: 1820,
    videoCodec: 'VP9 (Profile 0 / YUV420P)',
    audioCodec: 'Opus 48kHz Stereo (E2EE SFrame)',
    resolution: '1920x1080@60fps',
    e2eeProtocol: isPrivateRoom ? 'MLS RFC 9420 TreeKEM Ratchet' : 'WebRTC DTLS-SRTP (Public)',
  });

  // Call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDuration = useMemo(() => {
    const mins = Math.floor(callDuration / 60);
    const secs = callDuration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [callDuration]);

  // Speech simulation for realistic audio waves and green reticle pulses
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
          const shouldSpeak = Math.random() > 0.45;
          return {
            ...p,
            isSpeaking: shouldSpeak,
            audioLevel: shouldSpeak ? Math.floor(Math.random() * 80 + 20) : 0,
          };
        })
      );

      setMetrics((m) => ({
        ...m,
        ping: Math.floor(16 + Math.random() * 6),
        bitrateIn: Math.floor(2300 + Math.random() * 300),
      }));
    }, 1800);

    return () => clearInterval(interval);
  }, [isMicMuted, isDeafened, isVideoOn, isScreenSharing]);

  // Handle local camera toggle with real WebRTC getUserMedia
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
      senderName: 'YOU',
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
    const num = participants.length + 1;
    const id = `peer-node-0${num}`;
    const newPeer: CallParticipant = {
      id,
      name: `PEER_0${num} [ANONYMOUS]`,
      isLocal: false,
      isMuted: false,
      isDeafened: false,
      isVideoOn: Math.random() > 0.5,
      isSpeaking: false,
      audioLevel: 0,
      volume: 100,
      signalStrength: 3,
      role: `NODE_${num}`,
      avatarColor: '#202020',
    };
    setParticipants((prev) => [...prev, newPeer]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    if (spotlightId === id) setSpotlightId(null);
  };

  const handleVolumeChange = (id: string, vol: number) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, volume: vol } : p))
    );
  };

  // Dynamic grid auto-adaptation
  const gridLayoutClass = useMemo(() => {
    const count = participants.length;
    if (count <= 1) return 'grid-cols-1 max-w-3xl';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 max-w-5xl';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2 max-w-5xl';
    if (count <= 6) return 'grid-cols-2 lg:grid-cols-3 max-w-6xl';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-7xl';
  }, [participants.length]);

  const spotlightParticipant = useMemo(() => {
    if (spotlightId === 'local-screenshare') {
      return {
        id: 'local-screenshare',
        name: 'LOCAL SCREEN TRANSMISSION',
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
    <div className="relative w-full h-full flex flex-col bg-[#272727] text-[#e5e2e1] select-none overflow-hidden font-['Hanken_Grotesk',sans-serif] ob-grid-bg">
      {/* ─── 1. Technical Telemetry Header Bar ─── */}
      <header className="h-14 shrink-0 px-4 md:px-8 bg-[#181818] border-b border-[#333333] flex items-center justify-between z-30">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-3">
            {/* Pulsing Status Dot */}


            <div className="flex flex-col">


              {/* Sub-telemetry readout */}
              <div className="flex items-center gap-2 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 tracking-wider">

                <span>LATENCY: {metrics.ping}MS</span>
                <span>//</span>
                <span>TIME: {formattedDuration}</span>
              </div>
            </div>
          </div>
        </div>


      </header>

      {/* ─── 2. Main Stage ─── */}
      <main className="flex-1 min-h-0 relative p-4 md:p-6 flex flex-col items-center justify-center overflow-y-auto">
        {/* Floating Animated Reaction Emojis */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
          {reactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-24 flex flex-col items-center animate-reaction-rise pointer-events-none"
              style={{ left: `${r.x}%` }}
            >
              <span className="text-3xl filter drop-shadow-md select-none">{r.emoji}</span>
              <span className="font-['JetBrains_Mono',monospace] text-[9px] font-bold bg-[#181818] border border-[#333333] px-1.5 py-0.5 rounded text-zinc-200 mt-1 uppercase">
                {r.senderName}
              </span>
            </div>
          ))}
        </div>

        {/* LAYOUT A: SPOTLIGHT / FOCUS MODE */}
        {layoutMode === 'spotlight' && (
          <div className="w-full h-full max-w-7xl flex flex-col md:flex-row gap-4 pb-20">
            {/* Primary Center Screen */}
            <div className="flex-1 min-h-0 flex items-center justify-center bg-[#181818] rounded border border-[#333333] overflow-hidden relative shadow-2xl">
              {spotlightId === 'local-screenshare' ? (
                <div className="w-full h-full flex items-center justify-center bg-[#121212] relative">
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1 rounded bg-[#ff3535] text-white font-['JetBrains_Mono',monospace] font-bold text-xs uppercase tracking-wider shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    BROADCASTING DISPLAY // 1080P60
                  </div>
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  {!screenStreamRef.current && (
                    <div className="flex flex-col items-center text-center p-8 gap-4">
                      <div className="w-16 h-16 rounded bg-[#202020] border border-[#ff3535] flex items-center justify-center text-[#ff3535] shadow-xl">
                        <span className="material-symbols-outlined text-3xl">screen_share</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-[#ff3535] uppercase tracking-widest">
                          01 // STREAM_ACTIVE
                        </span>
                        <h4 className="text-xl font-bold text-white tracking-tight">Display Stream Transmitting</h4>
                        <p className="font-['JetBrains_Mono',monospace] text-xs text-zinc-400 max-w-md">
                          Encrypted WebRTC transport layer streaming at 60 frames per second.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <EnccomParticipantTile
                  participant={spotlightParticipant}
                  isSpotlight
                  onSpotlight={() => { }}
                  onVolumeClick={(id) => setShowVolumeFor(showVolumeFor === id ? null : id)}
                  onKick={handleRemoveParticipant}
                  localVideoRef={spotlightParticipant.isLocal ? localVideoRef : undefined}
                />
              )}
            </div>

            {/* Thumbnail Filmstrip */}
            <div className="w-full md:w-72 shrink-0 flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto pr-1">
              {participants.map((p) => {
                if (p.id === spotlightId && spotlightId !== 'local-screenshare') return null;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSpotlightId(p.id)}
                    className="w-52 md:w-full aspect-video shrink-0 cursor-pointer hover:border-[#ff3535] rounded transition-all"
                  >
                    <EnccomParticipantTile
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
          <div className={`w-full h-full grid gap-4 auto-rows-fr items-center justify-center pb-20 ${gridLayoutClass}`}>
            {participants.map((p) => (
              <div key={p.id} className="w-full h-full min-h-[180px] max-h-[380px] aspect-video">
                <EnccomParticipantTile
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

      {/* ─── 3. Individual Node Volume Modal ─── */}
      {showVolumeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={() => setShowVolumeFor(null)}>
          <div
            className="w-88 bg-[#181818] border border-[#333333] rounded p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-left font-['Hanken_Grotesk',sans-serif]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#333333]">
              <div className="flex flex-col">
                <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#ff3535] tracking-widest uppercase">
                  AUDIO GAIN // CONFIG
                </span>
                <span className="font-bold text-white text-sm font-['JetBrains_Mono',monospace]">
                  {participants.find((p) => p.id === showVolumeFor)?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowVolumeFor(null)}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="py-5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-['JetBrains_Mono',monospace]">
                <span className="text-zinc-400 uppercase">Input Amplitude</span>
                <span className="font-bold text-[#ff3535]">
                  {participants.find((p) => p.id === showVolumeFor)?.volume ?? 100}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                value={participants.find((p) => p.id === showVolumeFor)?.volume ?? 100}
                onChange={(e) => handleVolumeChange(showVolumeFor, parseInt(e.target.value))}
                className="w-full accent-[#ff3535] cursor-pointer h-2 bg-[#272727] rounded"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-['JetBrains_Mono',monospace] uppercase">
                <span>0% (MUTED)</span>
                <span>100% (UNITY)</span>
                <span>200% (BOOST)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleVolumeChange(showVolumeFor, 100)}
              className="w-full py-2 bg-[#202020] hover:bg-[#272727] border border-[#333333] hover:border-[#ff3535] text-xs font-['JetBrains_Mono',monospace] font-bold text-zinc-200 rounded uppercase transition-colors cursor-pointer"
            >
              Reset Unity (100%)
            </button>
          </div>
        </div>
      )}

      {/* ─── 4. Telecom WebRTC Packet Inspector Modal ─── */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowStatsModal(false)}>
          <div
            className="w-full max-w-xl bg-[#181818] border border-[#333333] rounded shadow-2xl overflow-hidden animate-in fade-in duration-200 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#202020] border-b border-[#333333] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff3535]" />
                <div className="flex flex-col">
                  <span className="font-['JetBrains_Mono',monospace] text-[10px] font-bold text-[#ff3535] tracking-widest uppercase">
                    01 // TELECOM TELEMETRY
                  </span>
                  <h3 className="text-white font-bold text-base tracking-tight font-['Hanken_Grotesk',sans-serif]">
                    Cryptographic Packet Inspector
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="text-zinc-400 hover:text-white cursor-pointer font-mono"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4 text-xs font-['JetBrains_Mono',monospace]">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded border-l-2 border-l-[#ff3535]">
                  <span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Round-Trip Latency</span>
                  <span className="text-xl font-bold text-white">{metrics.ping} MS</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">JITTER // {metrics.jitter}MS</span>
                </div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded border-l-2 border-l-[#10b981]">
                  <span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Packet Integrity</span>
                  <span className="text-xl font-bold text-[#10b981]">{metrics.packetLoss}% LOSS</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">STATUS // ZERO_DROP</span>
                </div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded">
                  <span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Inbound Throughput</span>
                  <span className="text-lg font-bold text-zinc-200">{metrics.bitrateIn} KBPS</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">{metrics.resolution}</span>
                </div>
                <div className="p-3.5 bg-[#202020] border border-[#333333] rounded">
                  <span className="text-zinc-400 text-[10px] uppercase block tracking-wider">Outbound Throughput</span>
                  <span className="text-lg font-bold text-zinc-200">{metrics.bitrateOut} KBPS</span>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">SIMULCAST // ACTIVE</span>
                </div>
              </div>

              <div className="p-4 bg-[#202020] border border-[#333333] rounded flex flex-col gap-2 text-xs">
                <div className="flex justify-between border-b border-[#333333]/50 pb-1.5">
                  <span className="text-zinc-400">Video Pipeline:</span>
                  <span className="text-white font-semibold">{metrics.videoCodec}</span>
                </div>
                <div className="flex justify-between border-b border-[#333333]/50 pb-1.5">
                  <span className="text-zinc-400">Audio Pipeline:</span>
                  <span className="text-white font-semibold">{metrics.audioCodec}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Encryption Scheme:</span>
                  <span className="text-[#ff3535] font-semibold">{metrics.e2eeProtocol}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-[#202020] border-t border-[#333333] flex justify-between items-center">
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-500 uppercase">
                RFC 9420 TREEKEM VERIFIED
              </span>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-[#ff3535] hover:bg-[#ff5252] text-white font-['JetBrains_Mono',monospace] font-bold rounded text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. Industrial Brutalist Control Dock ─── */}
      <footer className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#181818] border border-[#333333] px-3.5 py-2.5 rounded shadow-2xl">
        {/* Microphones Button */}
        <button
          type="button"
          onClick={() => setIsMicMuted((v) => !v)}
          className={`relative px-3 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isMicMuted
            ? 'bg-[#2e1616] text-[#ff3535] border-[#ff3535]'
            : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'
            }`}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isMicMuted ? 'mic_off' : 'mic'}
          </span>
          <span className="hidden sm:inline uppercase">{isMicMuted ? 'MUTED' : 'MIC'}</span>
          {!isMicMuted && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          )}
        </button>

        {/* Video Camera Toggle */}
        <button
          type="button"
          onClick={handleToggleCamera}
          className={`px-3 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isVideoOn
            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]'
            : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'
            }`}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isVideoOn ? 'videocam' : 'videocam_off'}
          </span>
          <span className="hidden sm:inline uppercase">{isVideoOn ? 'CAM ON' : 'CAM'}</span>
        </button>

        {/* Screen Share Toggle */}
        <button
          type="button"
          onClick={handleToggleScreenShare}
          className={`px-3 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isScreenSharing
            ? 'bg-[#ff3535] text-white border-[#ff3535]'
            : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'
            }`}
          title={isScreenSharing ? 'Stop Screen Sharing' : 'Transmit Display'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isScreenSharing ? 'stop_screen_share' : 'screen_share'}
          </span>
          <span className="hidden sm:inline uppercase">DISPLAY</span>
        </button>

        {/* Deafen Toggle */}
        <button
          type="button"
          onClick={() => setIsDeafened((v) => !v)}
          className={`px-3 py-2 rounded border transition-all cursor-pointer flex items-center gap-1.5 font-['JetBrains_Mono',monospace] text-xs font-bold ${isDeafened
            ? 'bg-[#2e1616] text-[#ff3535] border-[#ff3535]'
            : 'bg-[#202020] text-zinc-200 border-[#333333] hover:border-zinc-400'
            }`}
          title={isDeafened ? 'Undeafen' : 'Deafen (Mute Sound)'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDeafened ? 'headset_off' : 'headphones'}
          </span>
          <span className="hidden sm:inline uppercase">{isDeafened ? 'DEAF' : 'AUDIO'}</span>
        </button>

        {/* Reaction Picker Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowReactionsMenu((v) => !v)}
            className="p-2 rounded bg-[#202020] text-zinc-200 border border-[#333333] hover:border-zinc-400 transition-all cursor-pointer"
            title="Cryptographic Reaction Signal"
          >
            <span className="material-symbols-outlined text-[18px]">add_reaction</span>
          </button>

          {showReactionsMenu && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#181818] border border-[#333333] rounded p-2 flex items-center gap-1 shadow-2xl animate-in zoom-in-95 duration-100">
              {['🔥', '⚡', '🔒', '🛡️', '❤️', '👏', '🚀'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleTriggerReaction(emoji)}
                  className="w-9 h-9 rounded hover:bg-[#272727] flex items-center justify-center text-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-[#333333] mx-1" />

        {/* Disconnect Button (Enccom Signature Brutalist Red) */}
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded bg-[#ff3535] hover:bg-[#ff5252] text-white flex items-center gap-1.5 font-['JetBrains_Mono',monospace] font-bold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer border border-[#ff3535]"
          title="Disconnect from Transmission"
        >
          <span className="material-symbols-outlined text-[18px]">call_end</span>
          <span>DISCONNECT</span>
        </button>
      </footer>
    </div>
  );
};

// =========================================================================
// Subcomponent: Enccom High-Contrast Brutalist Participant Card
// =========================================================================
interface EnccomParticipantTileProps {
  participant: CallParticipant;
  isSpotlight?: boolean;
  isThumbnail?: boolean;
  onSpotlight: () => void;
  onVolumeClick: (id: string) => void;
  onKick: (id: string) => void;
  localVideoRef?: React.RefObject<HTMLVideoElement | null>;
}

const EnccomParticipantTile: React.FC<EnccomParticipantTileProps> = ({
  participant,
  isSpotlight = false,
  isThumbnail = false,
  onSpotlight,
  onVolumeClick,
  onKick,
  localVideoRef,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const isSpeakingNow = participant.isSpeaking && !participant.isMuted;

  // Active speaking reticle / border: Terminal emerald #10b981 or stealth #333333
  const borderClass = isSpeakingNow
    ? 'border-2 border-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.25)]'
    : 'border border-[#333333] hover:border-zinc-500';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full h-full rounded bg-[#181818] overflow-hidden flex items-center justify-center transition-all duration-200 group ${borderClass}`}
    >
      {/* Corner Reticle Markers (+) */}
      <span className="absolute top-1.5 left-2 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">
        +
      </span>
      <span className="absolute top-1.5 right-2 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">
        +
      </span>
      <span className="absolute bottom-1.5 left-2 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">
        +
      </span>
      <span className="absolute bottom-1.5 right-2 font-['JetBrains_Mono',monospace] text-[10px] text-zinc-600 pointer-events-none select-none z-20">
        +
      </span>

      {/* 1. Video Layer or Technical Avatar Card */}
      {participant.isVideoOn ? (
        <div className="w-full h-full relative bg-[#121212]">
          {participant.isLocal ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1c1c1c] to-[#242424] flex items-center justify-center relative">
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-16 h-16 rounded border border-[#333333] bg-[#272727] flex items-center justify-center shadow-lg">
                  <span className="font-['JetBrains_Mono',monospace] font-bold text-xl text-white">
                    {participant.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 uppercase tracking-widest">
                  STREAM // 1080P_60FPS
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Video Off: Enccom Brutalist Identity Card */
        <div className="w-full h-full flex flex-col items-center justify-center relative bg-[#181818] p-4">
          {/* Audio Wave Visualizer Spectrum */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map((bar) => (
              <span
                key={bar}
                className={`w-1 rounded-xs transition-all duration-150 ${isSpeakingNow
                  ? 'bg-[#10b981] animate-bounce'
                  : 'bg-[#333333] h-2'
                  }`}
                style={{
                  height: isSpeakingNow ? `${12 + (bar % 3) * 10}px` : '6px',
                  animationDelay: `${bar * 0.1}s`,
                }}
              />
            ))}
          </div>

          {/* Technical Avatar Box */}
          <div
            className={`border border-[#333333] bg-[#202020] rounded flex items-center justify-center font-['JetBrains_Mono',monospace] font-bold text-white shadow-xl transition-transform ${isThumbnail ? 'w-10 h-10 text-xs' : isSpotlight ? 'w-24 h-24 text-2xl' : 'w-16 h-16 text-lg'
              } ${isSpeakingNow ? 'border-[#10b981]' : ''}`}
          >
            {participant.name.slice(0, 2).toUpperCase()}
          </div>

          {!isThumbnail && (
            <div className="mt-3 flex flex-col items-center gap-0.5">
              <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff3535] font-bold tracking-widest uppercase">
                {participant.role || 'PEER_NODE'}
              </span>
              <span className="font-['JetBrains_Mono',monospace] text-[10px] text-zinc-400 uppercase tracking-wider">
                {isSpeakingNow ? 'TRANSMITTING VOICE' : 'CARRIER STANDBY'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2. Top-Right Technical Quick Actions (On Hover) */}
      {isHovered && !isThumbnail && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-[#181818]/90 border border-[#333333] p-1 rounded animate-in fade-in duration-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSpotlight();
            }}
            className="p-1 rounded hover:bg-[#272727] text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Focus / Pin Transmission"
          >
            <span className="material-symbols-outlined text-[15px]">pin_invoke</span>
          </button>

          {!participant.isLocal && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onVolumeClick(participant.id);
                }}
                className="p-1 rounded hover:bg-[#272727] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Node Audio Gain"
              >
                <span className="material-symbols-outlined text-[15px]">volume_up</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onKick(participant.id);
                }}
                className="p-1 rounded hover:bg-[#2e1616] text-zinc-300 hover:text-[#ff3535] transition-colors cursor-pointer"
                title="Drop Node"
              >
                <span className="material-symbols-outlined text-[15px]">person_remove</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 3. Bottom Asymmetrical Identity Card */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        {/* Nameplate - Asymmetric left border accent like CryptographicFlow Alice/Bob card */}
        <div className="flex items-center gap-2   px-2.5 py-1 rounded-r pointer-events-auto max-w-[80%]">
          <span className="font-['JetBrains_Mono',monospace] text-xs font-bold text-white tracking-wide truncate">
            {participant.name}
          </span>
          {participant.role && (
            <span className="font-['JetBrains_Mono',monospace] text-[9px] text-[#ff3535] font-bold uppercase tracking-wider shrink-0">
              {participant.role}
            </span>
          )}
        </div>

        {/* Status Indicators (Mic off, Deafen, Signal Bars) */}
        <div className="flex items-center gap-1.5 bg-[#181818]/90 border border-[#333333] px-2 py-1 rounded pointer-events-auto">
          {participant.isMuted && (
            <span className="material-symbols-outlined text-[#ff3535] text-[14px]" title="Muted">
              mic_off
            </span>
          )}
          {participant.isDeafened && (
            <span className="material-symbols-outlined text-[#ff3535] text-[14px]" title="Deafened">
              headset_off
            </span>
          )}

          {/* Telecom 3-bar signal indicator */}
          <div
            className="flex items-end gap-0.5 h-3 pl-1"
            title={`Signal Strength: ${participant.signalStrength === 3 ? 'Optimal' : 'Standard'}`}
          >
            <span className="w-0.5 h-1.5 rounded-none bg-[#10b981]" />
            <span
              className={`w-0.5 h-2.5 rounded-none ${participant.signalStrength >= 2 ? 'bg-[#10b981]' : 'bg-[#333333]'
                }`}
            />
            <span
              className={`w-0.5 h-3.5 rounded-none ${participant.signalStrength === 3 ? 'bg-[#10b981]' : 'bg-[#333333]'
                }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
