<div align="center">

# ENCCOM

### Private, real-time messaging without the Web3 baggage

[![React](https://img.shields.io/badge/React-frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-backend-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-in--memory-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-containerized-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-video-333333?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org/)

**No Web3. No Waku. No blockchain. Just a clean, understandable app with real cryptography behind it.**

</div>

---

## Table of Contents

- [What is ENCCOM?](#what-is-enccom)
- [Tech Stack](#tech-stack)
- [OpenMLS — the encryption part, explained simply](#openmls--the-encryption-part-explained-simply)
- [Where the Project Is Right Now](#where-the-project-is-right-now)
- [What's Planned Next](#whats-planned-next)

---

## What is ENCCOM?

ENCCOM is a chat app built with privacy in mind. You don't need an account to use it, and the app doesn't collect unnecessary personal data. The goal is to keep things simple while making private communication more secure.

ENCCOM has three main features:

1. **Public Chat**  : A normal open chat room that anyone can join when they open the app. It's not meant to be private, so the main focus here is keeping the room usable and preventing spam and abuse.

2. **Private Rooms:**  Private group chats where messages are encrypted on your device before they're sent to the server. The server only receives the encrypted data, not the actual message.

3. **Video Calls**  : Video and audio calls use WebRTC to connect users directly when possible. This means the server doesn't handle the actual video or audio stream.

The main idea behind ENCCOM is simple: **keep the application itself straightforward, and focus the complexity where it matters privacy and security.**

Instead of collecting data we don't need, ENCCOM tries to minimize what the server knows about its users and their conversations.


---

## Tech Stack

<div align="center">

| Layer | Technology | Role |
|:---:|:---:|:---|
| [![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/) | **React** | Frontend UI — what you see and click in your browser |
| [![Flask](https://img.shields.io/badge/-Flask-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/) | **Flask** | Backend server — handles logic and connections |
| [![Python](https://img.shields.io/badge/-Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/) | **Python** | Backend language |
| [![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?style=flat-square&logo=socketdotio&logoColor=white)](https://socket.io/) | **Socket.IO** | Real-time communication between browser and server (WebSockets) |
| [![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white)](https://redis.io/) | **Redis** | Fast in-memory storage for temporary data |
| [![Docker](https://img.shields.io/badge/-Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/) | **Docker** | Packages everything so it runs the same way everywhere |
| [![WebRTC](https://img.shields.io/badge/-WebRTC-333333?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org/) | **WebRTC** | Peer-to-peer video and audio for calls |

</div>

Nothing exotic — all mature, well-known tools.

---

## OpenMLS — the encryption part, explained simply

For **Private Rooms**, ENCCOM uses a protocol called **MLS (Messaging Layer Security)**, and specifically the **OpenMLS** implementation.

Here's the simple version of why:

- Group chats aren't as simple as "encrypt a message and send it to one person." People join and leave rooms over time, and everyone still in the group needs to be able to read new messages — while people who left shouldn't.
- MLS is a protocol *designed specifically* for this problem: encrypted group messaging where membership changes.
- Instead of inventing custom encryption (which is almost always a bad idea), ENCCOM uses OpenMLS — a real, maintained implementation of this protocol, compiled to **WebAssembly (WASM)** so it can run directly in the browser via React.

In short: messages get locked with a key **before** they ever leave your device. The server just passes the locked box along — it never has the key to open it.

---

## Where the Project Is Right Now

Currently added to the project:

- Integrated **OpenMLS** as a Rust → WebAssembly package (`openmls-wasm`)
- The compiled `pkg/` (wasm binary + JS bindings) is now pulled into the React app under `src/pkg/`
- Basic app structure is in place: Navbar, Chatbox, Rooms, About components, plus a `SocketContext` for managing the Socket.IO connection

So the cryptographic engine is now *available inside the frontend* — the next step is actually wiring it into the chat flow (generating keys, creating/joining groups, encrypting/decrypting messages through it).

---

## What's Planned Next

| Status | Item |
|:---:|---|
| Planned | Use WebRTC for video calls |
| Planned | Minimize persistent identity information |
| Planned | Minimize stored metadata |
| Planned | Reduce unnecessary server logs |
| Planned | Avoid fingerprinting and unnecessary tracking |
| Planned | Use established cryptographic standards over custom cryptography |

**Not part of this project:** Web3, Waku, blockchain infrastructure.
