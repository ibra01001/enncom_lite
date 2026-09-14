Here are the most famous and widely used methods to implement **End-to-End Encryption (E2EE) over WebSockets**.

In all E2EE architectures, the WebSocket server becomes a **blind relay** (zero-knowledge): it only routes metadata like `roomId` and binary/Base64 `ciphertext`, but never has access to the decryption keys or message plaintext.

---

### 1. The Signal Protocol (Double Ratchet + X3DH)
*Used by: **Signal, WhatsApp, Google Messages, Matrix (Olm)**.*

This is the gold standard for modern asynchronous messaging.

* **How it works**:
  1. **X3DH (Extended Triple Diffie-Hellman)**: Allows two clients to establish a shared secret even if one user is offline, using pre-published "pre-keys" stored on the server.
  2. **Double Ratchet**: For every message sent and received, the cryptographic keys derive a new single-use key (like a ratchet that only turns forward).
* **Key Strengths**:
  * **Forward Secrecy**: If a key is leaked today, past messages cannot be decrypted.
  * **Break-in Recovery (Post-Compromise Security)**: If an attacker steals a key, they lose access as soon as the next message exchange advances the ratchet.
* **Libraries**: `@signalapp/libsignal-client` or `libsignal-protocol-javascript`.

---

### 2. URL-Fragment / Shared Passphrase Derived Encryption (Zero-Knowledge Rooms)
*Used by: **PrivateBin, Bitwarden Send, CryptPad, temporary burner rooms**.*

Ideal for link-based private rooms (like the private room invite links in your app).

* **How it works**:
  1. When a user creates a room, a cryptographic key is generated and placed in the URL hash fragment:
     `https://app.com/chat?room=abc123#AES_KEY_BASE64`
  2. **Crucial detail**: Browsers never send the `#hash` part of a URL to the server (HTTP or WebSocket handshake).
  3. Anyone joining with that link extracts the key locally in their browser.
  4. Messages are encrypted/decrypted client-side using **AES-GCM (256-bit)** via the browser's native **Web Crypto API** (`window.crypto.subtle`).
* **Key Strengths**:
  * Simple to implement without needing complex public-key infrastructure.
  * Server only sees the `room_id` and encrypted blobs.

---

### 3. Asymmetric Hybrid Encryption (ECDH / X25519 + AES-GCM)
*Used by: **PGP/GPG, custom enterprise web apps**.*

* **How it works**:
  1. Each client generates an asymmetric key pair (e.g. **X25519** / **ECDH P-256**).
  2. Public keys are registered with the server; private keys stay in `IndexedDB` / browser storage.
  3. To send a message:
     * The sender performs a Diffie-Hellman key exchange with the recipient’s public key to derive a shared symmetric key.
     * The actual message is encrypted using fast **AES-256-GCM**.
* **Key Strengths**:
  * Native support in all modern browsers via `window.crypto.subtle` without third-party libraries.

---

### 4. MLS (Messaging Layer Security – IETF RFC 9420) & Megolm
*Used by: **Matrix (Megolm), Cisco Webex, Wire, next-gen group messengers**.*

* **Why it exists**:
  * Standard pairwise E2EE (like Signal) becomes slow in large group chats because a sender must encrypt the message separately for every participant ($O(N)$ operations).
* **How it works**:
  * Uses **TreeKEM** (a binary tree of keys) so key updates scale logarithmically ($O(\log N)$).
  * In Megolm (Matrix), each sender creates an outbound session ratchet, shares the ratchet seed once with group members via 1-to-1 encrypted channels, and broadcasts messages once to the whole room.
* **Key Strengths**:
  * Designed specifically for scalable, multi-user group chat rooms.

---

### 5. WebRTC DataChannels with DTLS-SRTP (Pure Peer-to-Peer)
*Used by: **BitTorrent Bleep, WebTorrent, direct P2P chat**.*

* **How it works**:
  1. The WebSocket is used only as a **signaling channel** to exchange connection metadata (SDP offers and ICE candidates).
  2. Once the WebRTC peer connection is established, clients open an encrypted `RTCDataChannel` directly between their browsers.
  3. Messages travel directly device-to-device over **DTLS (Datagram Transport Layer Security)** without touching the backend server.
* **Key Strengths**:
  * No message data is ever processed or stored on the server.

---

### Summary: Which is best for what?

| Method | Best Use Case | Implementation Complexity |
| :--- | :--- | :--- |
| **URL-Fragment AES-GCM** | Quick private invite rooms (e.g., `room_id#secret`) | **Low** (uses native `crypto.subtle`) |
| **Hybrid ECDH + AES-GCM** | Simple 1-to-1 persistent chats | **Medium** |
| **Signal Protocol** | High-security 1-to-1 chat with offline support | **High** (requires pre-key server) |
| **Megolm / MLS** | High-security multi-user group rooms | **High** |
| **WebRTC DataChannels** | Pure peer-to-peer real-time direct messaging | **Medium-High** |