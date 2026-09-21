import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { CallParticipant, CallLayoutMode, FloatingReaction } from './callTypes';
import { useAdaptiveCallLayout, useIsMobile } from './useAdaptiveCallLayout';
import { CallGrid, CallSpotlight, ReactionsOverlay } from './CallStage';
import { CallDock } from './CallDock';
import { VolumeModal } from './CallModals';
import type { TileDensity } from './ParticipantTile';

interface Props {
  roomId: string; isPrivateRoom?: boolean; myId?: string | null; onClose?: () => void;
}

const mockParticipants = (myId: string | null): CallParticipant[] => [
  { id: myId || 'user-local', name: `YOU [${(myId || 'LOCAL').slice(0, 6).toUpperCase()}]`, isLocal: true, isMuted: false, isVideoOn: false, isSpeaking: false, volume: 100, signalStrength: 3, role: 'HOST', avatarColor: '#ff3535' },
  { id: 'peer-alex-92', name: 'ALICE ', isLocal: false, isMuted: false, isVideoOn: true, isSpeaking: true, audioLevel: 80, volume: 100, signalStrength: 3, role: 'PEER_01', avatarColor: '#242424' },
  { id: 'peer-elena-44', name: 'BOB [NODE_OPERATOR]', isLocal: false, isMuted: true, isVideoOn: false, isSpeaking: false, volume: 90, signalStrength: 2, role: 'PEER_02', avatarColor: '#1c1c1c' },
  { id: 'peer-cipher-10', name: 'ZERO_KNOWLEDGE [VALIDATOR]', isLocal: false, isMuted: false, isVideoOn: false, isSpeaking: false, audioLevel: 25, volume: 100, signalStrength: 3, role: 'PEER_03', avatarColor: '#202020' },
];

export const VideoCall: React.FC<Props> = ({ roomId: _roomId, isPrivateRoom = false, myId = 'local-user', onClose }) => {
  void _roomId;
  const [layout, setLayout] = useState<CallLayoutMode>('grid');
  const [spotlightId, setSpotlightId] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [volumeFor, setVolumeFor] = useState<string | null>(null);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [page, setPage] = useState(0);

  const localRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dockRef = useRef<HTMLElement | null>(null);
  const [dockH, setDockH] = useState(88);
  const isMobile = useIsMobile(768);

  useEffect(() => {
    const el = dockRef.current; if (!el) return;
    const ro = new ResizeObserver(e => setDockH(Math.ceil(e[0].contentRect.height) + 20));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const [participants, setParticipants] = useState<CallParticipant[]>(() => mockParticipants(myId));

  useEffect(() => setPage(0), [participants.length, layout]);

  // mock speech
  useEffect(() => {
    const id = setInterval(() => {
      setParticipants(p => p.map(x => x.isLocal ? { ...x, isMuted: micMuted, isDeafened: deafened, isVideoOn: videoOn, isScreenSharing: screenOn } : x.isMuted ? { ...x, isSpeaking: false, audioLevel: 0 } : { ...x, isSpeaking: Math.random() > 0.45, audioLevel: Math.floor(Math.random() * 80 + 20) }));
    }, 1800);
    return () => clearInterval(id);
  }, [micMuted, deafened, videoOn, screenOn]);

  const toggleCam = async () => {
    if (videoOn) {
      localStream.current?.getTracks().forEach(t => t.stop()); localStream.current = null;
      setVideoOn(false); setParticipants(p => p.map(x => x.isLocal ? { ...x, isVideoOn: false, stream: null } : x));
    } else {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        localStream.current = s; if (localRef.current) localRef.current.srcObject = s;
        setVideoOn(true); setParticipants(p => p.map(x => x.isLocal ? { ...x, isVideoOn: true, stream: s } : x));
      } catch { setVideoOn(true); setParticipants(p => p.map(x => x.isLocal ? { ...x, isVideoOn: true } : x)); }
    }
  };

  const toggleShare = async () => {
    if (screenOn) {
      screenStream.current?.getTracks().forEach(t => t.stop()); screenStream.current = null;
      setScreenOn(false); if (spotlightId === 'local-screenshare') setSpotlightId(null);
    } else {
      try {
        const s = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true } as DisplayMediaStreamOptions);
        screenStream.current = s; if (screenRef.current) screenRef.current.srcObject = s;
        setScreenOn(true); setLayout('spotlight'); setSpotlightId('local-screenshare');
        s.getVideoTracks()[0].onended = () => { setScreenOn(false); setSpotlightId(null); };
      } catch { setScreenOn(true); setLayout('spotlight'); setSpotlightId('local-screenshare'); }
    }
  };

  const triggerReaction = useCallback((emoji: string) => {
    const r: FloatingReaction = { id: Math.random().toString(), emoji, senderName: 'YOU', x: Math.floor(20 + Math.random() * 60) };
    setReactions(p => [...p, r]); setShowReactions(false);
    setTimeout(() => setReactions(p => p.filter(x => x.id !== r.id)), 2800);
  }, []);

  const removeNode = useCallback((id: string) => {
    setParticipants(p => p.filter(x => x.id !== id));
    setSpotlightId(s => s === id ? null : s);
  }, []);

  const changeVolume = useCallback((id: string, v: number) => setParticipants(p => p.map(x => x.id === id ? { ...x, volume: v } : x)), []);

  const gap = isMobile ? 8 : 12;
  const { columns, totalPages, visibleCount, tileW } = useAdaptiveCallLayout(stageRef, participants.length, {
    gap, minTileW: isMobile ? 132 : 156, minTileH: isMobile ? 84 : 96, maxTileH: isMobile ? 260 : 360, controlDockReserve: dockH, currentPage: page,
  });

  const paginated = useMemo(() => totalPages <= 1 ? participants : participants.slice(page * visibleCount, page * visibleCount + visibleCount), [participants, page, visibleCount, totalPages]);
  const density: TileDensity = useMemo(() => tileW >= 300 ? 'large' : tileW >= 220 ? 'medium' : tileW >= 160 ? 'small' : 'tiny', [tileW]);
  const spotlight = useMemo(() => spotlightId === 'local-screenshare'
    ? { id: 'local-screenshare', name: 'LOCAL SCREEN TRANSMISSION', isLocal: true, isMuted: false, isVideoOn: true, isScreenSharing: true, isSpeaking: false, volume: 100, signalStrength: 3 as const }
    : participants.find(p => p.id === spotlightId) || participants[0], [spotlightId, participants]);

  if (!isPrivateRoom) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#181818] p-8 text-center font-mono">
        <div className="w-16 h-16 rounded bg-[#202020] border border-[#ff3535] flex items-center justify-center text-[#ff3535] mb-4 shadow-xl"><span className="material-symbols-outlined text-3xl">videocam_off</span></div>
        <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2">RESTRICTED TRANSMISSION</h3>
        <p className="text-xs text-zinc-400 max-w-md mb-6">Encrypted streams restricted to private MLS RFC 9420 rooms.</p>
        {onClose && <button type="button" onClick={onClose} className="px-4 py-2 bg-[#ff3535] text-white rounded text-xs font-bold uppercase cursor-pointer">DISCONNECT & RETURN</button>}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-[#272727] text-[#e5e2e1] select-none overflow-hidden font-['Hanken_Grotesk',sans-serif] ob-grid-bg">
      <main ref={stageRef} className="flex-1 min-h-0 relative flex flex-col overflow-hidden bg-[#272727]">
        <ReactionsOverlay reactions={reactions} />
        {layout === 'spotlight' ? (
          <CallSpotlight
            participants={participants} spotlight={spotlight as CallParticipant} spotlightId={spotlightId}
            isScreenSharing={screenOn} screenRef={screenRef} localRef={localRef} screenStreamRef={screenStream}
            onSpotlight={setSpotlightId} onVolume={setVolumeFor} onKick={removeNode}
          />
        ) : (
          <CallGrid
            participants={paginated} columns={columns} gap={gap} dockH={dockH} tileDensity={density}
            totalPages={totalPages} currentPage={page} visibleCount={visibleCount} tileW={tileW}
            onSpotlight={id => { setSpotlightId(id); setLayout('spotlight'); }} onVolume={setVolumeFor} onKick={removeNode}
            localRef={localRef} onPage={setPage}
          />
        )}
      </main>

      <VolumeModal id={volumeFor} participants={participants} onClose={() => setVolumeFor(null)} onChange={changeVolume} />

      <CallDock
        ref={dockRef}
        isMicMuted={micMuted} isVideoOn={videoOn} isScreenSharing={screenOn} isDeafened={deafened}
        layoutMode={layout} showReactions={showReactions}
        onToggleMic={() => setMicMuted(v => !v)} onToggleCam={toggleCam} onToggleShare={toggleShare} onToggleDeafen={() => setDeafened(v => !v)}
        onToggleLayout={() => setLayout(m => m === 'grid' ? 'spotlight' : 'grid')}
        onToggleReactions={() => setShowReactions(v => !v)} onReaction={triggerReaction} onClose={onClose}
      />
    </div>
  );
};

export default VideoCall;
