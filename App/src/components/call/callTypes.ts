export type CallLayoutMode = 'grid' | 'spotlight';

export interface CallParticipant {
  id: string;
  name: string;
  avatarColor?: string;
  isLocal?: boolean;
  isMuted: boolean;
  isDeafened?: boolean;
  isVideoOn: boolean;
  isScreenSharing?: boolean;
  isSpeaking: boolean;
  audioLevel?: number; // 0 to 100 for visual wave equalizer
  volume: number; // 0 to 200% local volume
  signalStrength: 1 | 2 | 3; // 1: weak, 2: medium, 3: excellent
  stream?: MediaStream | null;
  videoSrc?: string;
  role?: string;
}

export interface TelecomMetrics {
  ping: number; // ms
  jitter: number; // ms
  packetLoss: number; // %
  bitrateIn: number; // kbps
  bitrateOut: number; // kbps
  videoCodec: string; // e.g. VP9 / AV1 / H264
  audioCodec: string; // e.g. Opus 48kHz
  resolution: string; // e.g. 1920x1080@60fps
  e2eeProtocol: string; // e.g. MLS RFC 9420 + WebRTC SFrame
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  x: number; // percentage across container
}
