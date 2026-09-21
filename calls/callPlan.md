# 📞 Complete WebRTC Video Calling Architecture & Implementation Plan (`callPlan.md`)
**Project:** Enccom Lite (`enccom_lite`)  
**Scope:** 1-on-1 End-to-End Encrypted Private Video & Audio Calling  
**Reference Document:** [`calls/Webrtc.md`](file:///home/brahim/enccom_lite/calls/Webrtc.md)  
**Status:** Architectural Specification & Implementation Roadmap  

---

## 📑 Table of Contents
1. [Executive Summary & Core Objectives](#1-executive-summary--core-objectives)
2. [Deep Search: How Production Video Calling Works Under the Hood](#2-deep-search-how-production-video-calling-works-under-the-hood)
   - 2.1 The WebRTC Triad: Media, Network, & Security
   - 2.2 Signaling Mechanics & Session Description Protocol (SDP)
   - 2.3 NAT Traversal: ICE, STUN, & TURN Architecture
   - 2.4 Cryptographic Handshake: DTLS-SRTP & End-to-End Encryption
   - 2.5 The "Perfect Negotiation" Pattern (W3C Standard)
   - 2.6 Audio Dynamics & Real-Time Voice Activity Detection (VAD)
   - 2.7 Screen Sharing & Dynamic RTP Track Replacement
   - 2.8 Quality of Service (QoS) & WebRTC Statistics (`getStats`)
3. [System Architecture & Flow Diagrams](#3-system-architecture--flow-diagrams)
   - 3.1 Call Setup & Ringing State Machine
   - 3.2 Peer Connection & Trickle ICE Sequence
4. [Backend Specification (Flask-SocketIO)](#4-backend-specification-flask-socketio)
   - 4.1 Room Validation & Security Guardrails
   - 4.2 Signaling Event Payloads & Handlers
5. [Frontend Specification (React + Vite + TypeScript)](#5-frontend-specification-react--vite--typescript)
   - 5.1 Architecture: `useWebRTC` Hook
   - 5.2 Real Media Streams & Video Tile Rendering
   - 5.3 Audio Analyser Node & Real-Time Wave Equalizer
   - 5.4 Incoming Call Modal & Ringer Overlay
   - 5.5 Telecom Diagnostics Engine (Live Bitrate, Jitter, Packet Loss)
6. [Step-by-Step Phased Implementation Plan](#6-step-by-step-phased-implementation-plan)
7. [Edge Cases, Error Recovery, & Production Resilience](#7-edge-cases-error-recovery--production-resilience)

---

## 1. Executive Summary & Core Objectives

In `enccom_lite`, communication in private rooms is protected by MLS (Messaging Layer Security) principles. Extending this to high-fidelity audio and video communications requires an implementation of **WebRTC (Web Real-Time Communication)** that matches this standard.

### Core Objectives:
1. **Private Chat Exclusivity:** As required, video calls are strictly permitted only within authenticated private 1-on-1 rooms (`isPrivateRoom === true`). Public channels cannot initiate calls.
2. **True Peer-to-Peer Architecture:** 1-on-1 private calls bypass central media servers. Audio and video streams flow directly between user devices via UDP over encrypted SRTP tunnels, keeping server bandwidth usage near zero.
3. **No Mocks, 100% Real Hardware Integration:** Replace existing mock participant data, random speech generators, and static avatars with real camera (`getUserMedia`), microphone, screen share (`getDisplayMedia`), and Web Audio API spectrum analyzers.
4. **Resilience & Production Rigor:** Zero-glare race condition resolution using W3C Perfect Negotiation, Trickle ICE candidate queuing, and automatic ICE restarts upon network degradation.

---

## 2. Deep Search: How Production Video Calling Works Under the Hood

To build an industry-standard video calling system, we must dissect the protocols and specifications that govern WebRTC.

### 2.1 The WebRTC Triad: Media, Network, & Security
WebRTC is not a single protocol—it is a suite of standards working in coordination:

```
+-------------------------------------------------------------+
|                      Application Layer                      |
|          (React UI, State Machines, Audio Analyser)         |
+-------------------------------------------------------------+
|                      WebRTC APIs                            |
|     (RTCPeerConnection, MediaStream, RTCRtpSender)          |
+-------------------------------------------------------------+
|        Security Layer         |        Transport Layer      |
|    DTLS (Key Exchange)        |     ICE / STUN / TURN       |
|    SRTP (Encrypted Media)     |     UDP (Low-latency)       |
|    SCTP (Data Channels)       |     TCP Fallback            |
+-------------------------------------------------------------+
```

1. **Media Layer:** Captures audio and video using hardware encoders (Opus for audio at 48kHz; VP8, VP9, or H.264 for video).
2. **Network Layer:** Traverses Network Address Translation (NAT) and stateful firewalls using ICE to punch UDP pinholes.
3. **Security Layer:** Mandatory end-to-end encryption using DTLS (Datagram Transport Layer Security) to negotiate keys, followed by SRTP (Secure Real-time Transport Protocol) to encrypt every media packet.

---

### 2.2 Signaling Mechanics & Session Description Protocol (SDP)
WebRTC does not define a signaling protocol. Peers need an out-of-band communication channel (our Flask-SocketIO backend) to exchange capability metadata represented as **SDP (Session Description Protocol)**.

#### The Offer/Answer Lifecycle:
1. **Offer Creation:** Peer A calls `pc.createOffer()`. The browser generates an SDP text document listing:
   - Supported video/audio codecs (e.g. `a=rtpmap:111 opus/48000/2`, `a=rtpmap:96 VP8/90000`)
   - Encryption fingerprint (DTLS certificate hash)
   - Media directions (`sendrecv`, `sendonly`, `recvonly`)
   - Network candidates
2. **Setting Local Description:** Peer A calls `pc.setLocalDescription(offer)` and transmits the SDP to Peer B via Socket.IO (`webrtc:offer`).
3. **Setting Remote Description:** Peer B receives the offer and invokes `pc.setRemoteDescription(new RTCSessionDescription(offer))`.
4. **Answer Creation:** Peer B calls `pc.createAnswer()`, sets it locally via `pc.setLocalDescription(answer)`, and emits it back (`webrtc:answer`).
5. **Finalizing Handshake:** Peer A calls `pc.setRemoteDescription(new RTCSessionDescription(answer))`. The media session is now formally negotiated.

---

### 2.3 NAT Traversal: ICE, STUN, & TURN Architecture

Almost all client devices sit behind routers utilizing NAT (Network Address Translation). Device A cannot reach Device B on private IPs like `192.168.1.15`.

```
[Peer A: 192.168.1.15] ──> [NAT Router A] ────── Internet ────── [NAT Router B] <── [Peer B: 10.0.0.4]
                                 │                                     │
                        (Discovers Public IP)                 (Discovers Public IP)
                                 │                                     │
                                 v                                     v
                        [STUN Server (RFC 8489)]              [STUN Server (RFC 8489)]
```

#### The Candidate Hierarchy:
- **Host Candidate:** The device's local network IP address (e.g. `192.168.0.x`). Effective for devices on the same LAN/Wi-Fi.
- **Server Reflexive Candidate (`srflx`):** Discovered by contacting a **STUN (Session Traversal Utilities for NAT)** server. The STUN server reflects back the external public IP and port assigned by the NAT router.
- **Relay Candidate (`relay`):** When symmetric NATs or enterprise firewalls prohibit direct P2P UDP packet traversal, the connection falls back to a **TURN (Traversal Using Relays around NAT)** server. The TURN server acts as an encrypted UDP relay proxy.

#### Trickle ICE vs. Vanilla ICE:
- **Vanilla ICE (Slow):** Waits until all STUN/TURN queries finish and bundles all candidates into the initial SDP offer. Causes a 3 to 8 second delay before the other phone even rings.
- **Trickle ICE (Ultra-Fast - Our Standard):** Sends the SDP offer immediately with 0 candidates. As each candidate is discovered asynchronously via `pc.onicecandidate`, it is transmitted across the socket (`webrtc:ice-candidate`) and ingested by the remote peer using `pc.addIceCandidate()`.

---

### 2.4 Cryptographic Handshake: DTLS-SRTP & End-to-End Encryption
WebRTC enforces encryption at the protocol level. Plaintext audio/video transmission over the wire is impossible by browser specification:
1. **Ephemeral Key Generation:** Each browser generates an ephemeral self-signed X.509 certificate on startup.
2. **Fingerprint Verification:** The SHA-256 fingerprint of the certificate is exchanged inside the SDP.
3. **DTLS Handshake:** Once ICE punches a UDP hole between the two devices, they perform a DTLS handshake over that UDP socket.
4. **SRTP Keys:** The DTLS handshake securely derives master keys used by the AES-GCM cipher to encrypt every media packet (SRTP). Eavesdroppers on Wi-Fi, ISPs, or even the signaling server cannot decrypt the media stream.

---

### 2.5 The "Perfect Negotiation" Pattern (W3C Standard)
In real-world WebRTC applications, race conditions called **Glare** occur when both peers attempt to renegotiate or initiate calls at the exact same moment (e.g. both peers click "Call" simultaneously, or both toggle video/screen share at once).

To eliminate unhandled state machine exceptions (`InvalidStateError: HaveLocalOffer`), we implement the official W3C **Perfect Negotiation** pattern:

```ts
// Tie-breaking: Determine who is polite based on deterministic user IDs
const isPolite = myId.localeCompare(remotePeerId) > 0;

pc.onnegotiationneeded = async () => {
  try {
    makingOffer = true;
    await pc.setLocalDescription();
    socket.emit('webrtc:offer', { targetPeerId, sdp: pc.localDescription });
  } catch (err) {
    console.error('Negotiation error:', err);
  } finally {
    makingOffer = false;
  }
};

// When remote offer arrives:
const offerCollision = (desc.type === 'offer') &&
  (makingOffer || pc.signalingState !== 'stable');

ignoreOffer = !isPolite && offerCollision;
if (ignoreOffer) {
  return; // Impolite peer stands its ground
}

if (offerCollision) {
  // Polite peer rolls back its local offer and accepts remote offer
  await pc.setLocalDescription({ type: 'rollback' });
}
await pc.setRemoteDescription(desc);
if (desc.type === 'offer') {
  await pc.setLocalDescription();
  socket.emit('webrtc:answer', { targetPeerId, sdp: pc.localDescription });
}
```

---

### 2.6 Audio Dynamics & Real-Time Voice Activity Detection (VAD)
Instead of simulating speaking states with `Math.random()`, we connect incoming and outgoing audio streams to the **Web Audio API**:

```
[Local/Remote MediaStream] 
         │
         ▼
 [AudioContext] ──> [MediaStreamAudioSourceNode]
                           │
                           ▼
                    [AnalyserNode] (fftSize: 256)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
  [Frequency Spectrum Data]       [Volume RMS Calculation]
   (Used for Audio Equalizer       (Threshold > 15 = isSpeaking)
    Wave Bar Animation)
```
- Samples the audio spectrum every 50ms using `analyser.getByteFrequencyData()`.
- Calculates Root-Mean-Square (RMS) volume level (0 to 100).
- Dynamically triggers the emerald speaking border (`border-[#10b981]`) and pulsing waves when speech exceeds a baseline threshold.

---

### 2.7 Screen Sharing & Dynamic RTP Track Replacement
Traditional implementations tear down the entire peer connection to share the screen. The modern standard uses **`RTCRtpSender.replaceTrack()`**:

1. Call `navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })`.
2. Locate the existing video sender:
   ```ts
   const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
   ```
3. Seamlessly swap the track without SDP renegotiation:
   ```ts
   await videoSender.replaceTrack(screenTrack);
   ```
4. When screen sharing ends (`screenTrack.onended`), swap back to the camera track:
   ```ts
   await videoSender.replaceTrack(cameraTrack);
   ```

---

### 2.8 Quality of Service (QoS) & WebRTC Statistics (`getStats`)
To populate the live diagnostics panel in the UI (`TelecomMetrics`), we query the browser's internal statistics engine:
- **Bitrate:** `(bytesReceived - prevBytes) * 8 / (timeDelta)` (reported in kbps)
- **Round-Trip Time (RTT/Ping):** Derived from `candidate-pair.currentRoundTripTime`
- **Packet Loss:** `(packetsLost / totalPackets) * 100` (%)
- **Jitter:** Derived from `inbound-rtp.jitter` (ms)
- **Active Codec:** Extracted from the `codec` dictionary (`Opus`, `VP9`, `AV1`)

---

## 3. System Architecture & Flow Diagrams

### 3.1 Call Setup & Ringing State Machine

```
User A (Caller)              Flask-SocketIO Server             User B (Callee)
      │                                │                              │
      │── call:initiate (roomId) ─────>│                              │
      │                                │── call:incoming (from: A) ──>│
      │                                │                              │  [Ringtone plays]
      │                                │                              │  [Modal appears: Accept/Reject]
      │                                │<─ call:accept (roomId) ──────│
      │<─ call:accepted (by: B) ───────│                              │
      │                                │                              │
   [Enter Call Stage]                  │                           [Enter Call Stage]
   [Acquire Media Devices]             │                           [Acquire Media Devices]
   [Initialize RTCPeerConnection]      │                           [Initialize RTCPeerConnection]
```

### 3.2 Peer Connection & Trickle ICE Sequence

```
User A (Initiator / Impolite)     Flask-SocketIO Server       User B (Receiver / Polite)
      │                                │                              │
  Create Offer & setLocalDesc()        │                              │
      │── webrtc:offer (sdp) ─────────>│── webrtc:offer (sdp) ───────>│
      │                                │                              │  setRemoteDesc(offer)
      │                                │                              │  Create Answer & setLocalDesc()
      │<── webrtc:answer (sdp) ────────│<── webrtc:answer (sdp) ──────│
  setRemoteDesc(answer)                │                              │
      │                                │                              │
  [STUN discovers candidate]           │                              │
      │── webrtc:ice-candidate ───────>│── webrtc:ice-candidate ─────>│  pc.addIceCandidate()
      │                                │                              │
      │                                │   [STUN discovers candidate] │
      │<── webrtc:ice-candidate ───────│<── webrtc:ice-candidate ────│
  pc.addIceCandidate()                 │                              │
      │                                │                              │
      │═══════════════════════════════════════════════════════════════│
      │        Direct P2P UDP Media Channel Established (DTLS-SRTP)   │
      │═══════════════════════════════════════════════════════════════│
      │                                                               │
  [Stream camera & mic]                                      [Stream camera & mic]
```

---

## 4. Backend Specification (Flask-SocketIO)

We introduce a dedicated backend event module: [`backend/events/call.py`](file:///home/brahim/enccom_lite/backend/events/call.py) registered via [`backend/events/__init__.py`](file:///home/brahim/enccom_lite/backend/events/__init__.py).

### 4.1 Room Validation & Security Guardrails
1. **Private Room Verification:** The server checks `rooms.get(room_id)` to ensure `is_private == True`. If a user attempts to initiate a call in `public` or a non-private room, the server rejects it with an error event:
   ```python
   emit('call:error', {'message': 'Video calls are restricted to private 1-on-1 rooms.'})
   ```
2. **Peer Limit Verification:** Private calls are strictly 1-on-1. If a third party attempts to join an active call session, the server responds with a `call:busy` event.

### 4.2 Signaling Event Specifications

| Event Name | Direction | Payload Structure | Description |
|---|---|---|---|
| `call:initiate` | Client -> Server | `{ roomId: string }` | Caller starts ringing peer in private room |
| `call:incoming` | Server -> Client | `{ roomId: string, callerId: string, callerName: string }` | Callee receives ringing alert with accept/decline |
| `call:accept` | Client -> Server | `{ roomId: string }` | Callee accepts the call; triggers session startup |
| `call:accepted` | Server -> Client | `{ roomId: string, peerId: string }` | Notifies caller to begin WebRTC offer negotiation |
| `call:reject` | Client -> Server | `{ roomId: string, reason: string }` | Callee rejects (busy or declined) |
| `call:rejected` | Server -> Client | `{ roomId: string, reason: string }` | Notifies caller of declination |
| `call:hangup` | Client -> Server | `{ roomId: string }` | Either party ends the call |
| `call:ended` | Server -> Client | `{ roomId: string }` | Tears down remote peer connection |
| `webrtc:offer` | Client <-> Server | `{ roomId: string, targetId: string, sdp: object }` | Relays SDP offer to peer |
| `webrtc:answer` | Client <-> Server | `{ roomId: string, targetId: string, sdp: object }` | Relays SDP answer to peer |
| `webrtc:ice` | Client <-> Server | `{ roomId: string, targetId: string, candidate: object }` | Relays Trickle ICE candidate to peer |

---

## 5. Frontend Specification (React + Vite + TypeScript)

### 5.1 Architecture: `useWebRTC` Custom Hook
Create [`App/src/hooks/useWebRTC.ts`](file:///home/brahim/enccom_lite/App/src/hooks/useWebRTC.ts) encapsulating the entire WebRTC state and lifecycle:

```ts
interface WebRTCState {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  isCallActive: boolean;
  isCalling: boolean;
  incomingCall: { callerId: string; callerName: string; roomId: string } | null;
  metrics: TelecomMetrics;
  isMicMuted: boolean;
  isVideoOn: boolean;
  isScreenSharing: boolean;
  localAudioLevel: number;
  remoteAudioLevel: number;
  isLocalSpeaking: boolean;
  isRemoteSpeaking: boolean;
}

interface WebRTCActions {
  startCall: (roomId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMic: () => void;
  toggleCam: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
}
```

### 5.2 Real Media Streams & Video Tile Rendering
Currently, [`ParticipantTile.tsx`](file:///home/brahim/enccom_lite/App/src/components/call/ParticipantTile.tsx) only assigns a `<video>` tag for `participant.isLocal`. 

**The Fix:**
1. Update `ParticipantTile.tsx` to accept a `stream?: MediaStream | null` prop.
2. For remote participants (`!participant.isLocal`):
   ```tsx
   const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
   useEffect(() => {
     if (remoteVideoRef.current && participant.stream) {
       remoteVideoRef.current.srcObject = participant.stream;
     }
   }, [participant.stream]);

   // In JSX:
   <video
     ref={remoteVideoRef}
     autoPlay
     playsInline
     className="w-full h-full object-cover"
   />
   ```
3. Audio for remote participants will play automatically through the `<video>` element (or a dedicated `<audio>` element) with volume controlled by the slider in `VolumeModal`.

### 5.3 STUN Server Configuration
We configure reliable public STUN servers for NAT traversal:
```ts
export const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};
```

### 5.4 Incoming Call Modal & Ringer Overlay
Add an incoming call notification modal in [`Chatbox.tsx`](file:///home/brahim/enccom_lite/App/src/components/Chatbox.tsx):
- Audible ringing indicator (synthesized Web Audio ringtone or audio chime).
- Cyberpunk-styled prompt: **"INCOMING ENCRYPTED STREAM REQUEST FROM [PEER_NAME]"**.
- Buttons: **ACCEPT (Green)** or **DECLINE (Red)**.

---

## 6. Step-by-Step Phased Implementation Plan

### Phase 1: Backend Signaling Architecture
1. **Create [`backend/events/call.py`](file:///home/brahim/enccom_lite/backend/events/call.py):**
   - Implement `call:initiate`, `call:accept`, `call:reject`, `call:hangup`, `webrtc:offer`, `webrtc:answer`, and `webrtc:ice`.
   - Validate that `roomId` corresponds to a private room.
2. **Register Call Events:**
   - Add `from . import call` in [`backend/events/__init__.py`](file:///home/brahim/enccom_lite/backend/events/__init__.py).
3. **Clean up legacy file:**
   - Deprecate/consolidate [`backend/signaling.py`](file:///home/brahim/enccom_lite/backend/signaling.py) into the modular events structure.

### Phase 2: WebRTC Core Hook & State Machine
1. **Create [`App/src/hooks/useWebRTC.ts`](file:///home/brahim/enccom_lite/App/src/hooks/useWebRTC.ts):**
   - Implement `RTCPeerConnection` instance lifecycle.
   - Implement W3C Perfect Negotiation (`makingOffer`, `ignoreOffer`, `isPolite`).
   - Implement ICE candidate queue for pre-SDP candidates.
   - Implement Web Audio API VAD (Voice Activity Detection) for speaker levels.
   - Implement `getStats` metrics polling interval (bitrate, jitter, ping, loss).

### Phase 3: Hardware Capture & Dynamic Track Control
1. **Camera & Microphone Management:**
   - Implement `getUserMedia` with echo cancellation, noise suppression, and auto gain.
   - Toggle audio track enabled status (`track.enabled = !track.enabled`) for instant muting.
   - Toggle video track with resource conservation (stop track on camera off, re-acquire on camera on).
2. **Screen Sharing:**
   - Integrate `getDisplayMedia` with `sender.replaceTrack`.
   - Handle automatic fallback when user clicks "Stop Sharing" on the browser native banner.

### Phase 4: UI Component Integration & Stream Binding
1. **Refactor [`ParticipantTile.tsx`](file:///home/brahim/enccom_lite/App/src/components/call/ParticipantTile.tsx):**
   - Support real `MediaStream` attachment on remote video tags.
   - Link `audioLevel` and `isSpeaking` to real Web Audio analyser outputs.
2. **Refactor [`call.tsx`](file:///home/brahim/enccom_lite/App/src/components/call/call.tsx):**
   - Connect props from `useWebRTC` instead of `mockParticipants`.
   - Remove interval-based fake speaking simulation.
   - Bind dock actions (Mute, Video, Share, Hangup) to real WebRTC methods.
3. **Refactor [`Chatbox.tsx`](file:///home/brahim/enccom_lite/App/src/components/Chatbox.tsx):**
   - Add Incoming Call Alert Banner/Modal with ringing audio.
   - Ensure call button is only enabled when room is private (`isPrivateRoom`).

### Phase 5: Verification & Quality Assurance
1. **Multi-Browser Testing:**
   - Open two incognito browser windows (User A & User B in the same private room).
   - Verify: Ringing -> Accept -> Camera & Audio Stream exchange.
2. **Hardware Permutations:**
   - Test mute/unmute audio.
   - Test camera on/off.
   - Test screen share swap and revert.
3. **Network Resilience & Disconnect Handling:**
   - Test call decline and hang up from either side.
   - Test closing a tab mid-call; verify clean teardown and remote peer notification.
   - Verify console is free of WebRTC negotiation or state errors.

---

## 7. Edge Cases, Error Recovery, & Production Resilience

1. **Remote Candidate Queuing:**
   - *Problem:* Fast STUN servers may yield ICE candidates before the receiver has set the remote SDP offer. Calling `pc.addIceCandidate()` in this state throws an `InvalidStateError`.
   - *Solution:* If `!pc.remoteDescription`, push candidates to an internal FIFO queue `candidateQueue`. Flush all queued candidates immediately following `await pc.setRemoteDescription()`.
2. **Camera Permission Denied:**
   - *Problem:* User denies camera access or has no webcam connected.
   - *Solution:* Gracefully fallback to audio-only constraints (`{ audio: true, video: false }`) and notify user via UI toast.
3. **Silent Background Tab Throttling:**
   - *Problem:* Browsers throttle `setInterval` in inactive tabs, slowing down stats and audio analyzers.
   - *Solution:* WebRTC audio/video tracks are handled by the browser's native C++ media pipeline and are not impacted by tab throttling. For stats, update only when the tab is visible (`document.visibilityState === 'visible'`).
4. **Clean Disconnection on Browser Close:**
   - *Problem:* User closes the tab without clicking "Hang Up".
   - *Solution:* The Flask-SocketIO `disconnect` event detects socket closure and broadcasts `call:ended` to the remaining peer in the room, automatically closing their video stage.

---
*Created as part of the Enccom Lite Secure Communications Suite.*
