# ENCCOM WebRTC Group Calling — Implementation Plan

## 1. Goal

Implement real-time group audio/video calls inside private ENCCOM rooms.

* A member starts a call inside a private room.
* Every member in the room receives an incoming-call notification.
* Members can choose to join the active call.
* Each participant can mute audio, disable video, share their screen, or leave.
* The host can end the call for everyone.
* WebRTC handles the media connection and media encryption.
* MLS is NOT used for call encryption and remains independent.

## 2. Architecture

```text
React UI
   │
WebRTC Hook
   │
Group Call Manager
   │
RTCPeerConnections
   │
WebRTC Media
   │
P2P / TURN
```

Socket.IO is used only for signaling:

```text
Participant A → Socket.IO → Backend → Socket.IO → Participants
```

The backend never carries the audio/video stream.

## 3. Files to Create

### Backend

**`backend/events/call.py`**

Purpose: Handle all call-related Socket.IO events.

Responsibilities:

* Start a room call.
* Notify all room members.
* Allow members to join/leave.
* End the call.
* Relay WebRTC offers, answers, and ICE candidates.
* Validate that the user belongs to the room.

Main events:

```text
call:start
call:join
call:leave
call:end
webrtc:offer
webrtc:answer
webrtc:ice
```

**`backend/events/__init__.py`**

Purpose: Register the new `call.py` event handlers when the backend starts.

**`backend/signaling.py`**

Purpose: Remove/deprecate the old generic signaling implementation once `call.py` replaces it.

### Frontend

**`App/src/hooks/useWebRTC.ts`**

Purpose: Main React hook for the WebRTC system.

Responsibilities:

* Manage the local camera/microphone.
* Connect to the group-call manager.
* Store call state.
* Expose actions to the UI.
* Track local and remote media streams.
* Clean up connections when leaving.

Example actions:

```text
startCall()
joinCall()
leaveCall()
endCall()
toggleMic()
toggleCamera()
toggleScreenShare()
```

**`App/src/webrtc/groupCall.ts`**

Purpose: Manage the entire group call.

Responsibilities:

* Track call participants.
* Create one `RTCPeerConnection` per remote participant.
* Add/remove participants.
* Create offers and answers.
* Handle remote streams.
* Handle participant disconnects.

Example:

```text
A
├── Connection → B
├── Connection → C
└── Connection → D
```

**`App/src/webrtc/peerConnection.ts`**

Purpose: Manage one individual WebRTC peer connection.

Responsibilities:

* Create `RTCPeerConnection`.
* Add local tracks.
* Handle offers/answers.
* Handle ICE candidates.
* Receive remote tracks.
* Monitor connection state.
* Close and clean up the connection.

**`App/src/webrtc/media.ts`**

Purpose: Manage camera, microphone, and screen capture.

Responsibilities:

* `getUserMedia()`
* `getDisplayMedia()`
* Mute/unmute audio.
* Enable/disable camera.
* Replace camera track with screen track.
* Stop media tracks.

**`App/src/webrtc/signaling.ts`**

Purpose: Connect WebRTC signaling with the existing Socket.IO system.

Responsibilities:

* Send/receive offers.
* Send/receive answers.
* Send/receive ICE candidates.
* Send/receive call start/join/leave/end events.

**`App/src/webrtc/ice.ts`**

Purpose: Store Web
