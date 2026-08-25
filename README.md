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

**No Web3. No Waku. No blockchain. Just a clean architecture with real cryptography behind it.**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Current Architecture](#current-architecture)
- [Tech Stack](#tech-stack)
- [Main Features](#main-features)
  - [Public Chat](#public-chat)
  - [Private Rooms](#private-rooms)
  - [Video Calls](#video-calls)
- [Security Goals](#security-goals)
- [Message Security](#message-security)
- [Metadata Protection](#metadata-protection)
- [Identity Protection](#identity-protection)
- [Privacy Models by Feature](#privacy-models-by-feature)
- [Backend Security Checklist](#backend-security-checklist)
- [Security Philosophy](#security-philosophy)
- [Roadmap](#roadmap)

---

## Overview

> ENCCOM is a real-time messaging application focused on **private communication** without depending on Web3 or decentralized messaging protocols.

The project began as a simple Web2 chat app built on a central server and WebSockets. The direction has since shifted. Rather than migrating to Waku or another Web3 protocol, the goal is now to build a **privacy-focused messaging system on top of a simple, understandable architecture**.

The core idea: keep the infrastructure practical, and put the real engineering effort into **message encryption**, **identity protection**, and **metadata minimization**.

| Design Principle | Meaning |
|---|---|
| Simple infrastructure | No decentralized network to operate or debug |
| Strong cryptography | Effort goes into E2EE, not novel protocols |
| Minimal footprint | Collect only what a feature strictly requires |
| Boring tech, done well | React, Flask, Redis, and Docker, nothing exotic |

---

## Current Architecture

ENCCOM uses a **traditional client-server architecture**.

```
┌──────────────┐        WebSocket (Socket.IO)        ┌──────────────┐
│              │ ───────────────────────────────────▶ │              │
│  React App   │                                       │  Flask +     │
│  (Client)    │ ◀─────────────────────────────────── │  Flask-      │
│              │                                       │  SocketIO    │
└──────────────┘                                       └──────┬───────┘
                                                                │
                                                                ▼
                                                        ┌──────────────┐
                                                        │    Redis     │
                                                        │ (in-memory   │
                                                        │  store /     │
                                                        │  messaging)  │
                                                        └──────────────┘

              All services run consistently inside Docker / Docker Compose
```

A user connects through the **React frontend**. The **Flask backend** manages application logic and real-time communication. **Redis** acts as the in-memory data store and messaging layer where needed. **Docker** ensures the whole stack runs consistently across environments.

The server is responsible for connections, rooms, message delivery, and the application state that is intentionally kept server-side.

---

## Tech Stack

<div align="center">

| Layer | Technology | Role |
|:---:|:---:|:---|
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black) | **React** | Frontend UI |
| ![Socket.IO](https://img.shields.io/badge/-Socket.IO-010101?logo=socketdotio&logoColor=white) | **Socket.IO** | WebSocket communication between client and server |
| ![Python](https://img.shields.io/badge/-Python-3776AB?logo=python&logoColor=white) | **Python** | Backend language |
| ![Flask](https://img.shields.io/badge/-Flask-000000?logo=flask&logoColor=white) | **Flask** | Application server |
| ![Flask](https://img.shields.io/badge/-Flask--SocketIO-000000?logo=flask&logoColor=white) | **Flask SocketIO** | Real time event handling |
| ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white) | **Redis** | In memory store and messaging layer |
| ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white) | **Docker** | Containerization |
| ![Docker Compose](https://img.shields.io/badge/-Docker%20Compose-2496ED?logo=docker&logoColor=white) | **Docker Compose** | Multi container orchestration |
| ![WebRTC](https://img.shields.io/badge/-WebRTC-333333?logo=webrtc&logoColor=white) | **WebRTC** | Peer to peer video and audio |

</div>

---

## Main Features

ENCCOM is built around three main communication features.

### Public Chat

A public room any user can join simply by opening the application.

- **Not** designed for private communication. The goal is real-time interaction between users.
- Because the room is public by nature, focus is on:
  - Abuse prevention
  - Rate limiting
  - Availability
  - Minimizing unnecessary user information

### Private Rooms

Encrypted group conversations rather than fixed one-to-one chats.

- Private rooms are designed for **group communication**. Anyone holding the private room link can join and participate.
- Because membership can change over time, the encryption system must support **multiple users and evolving group membership**, not just a single fixed pair of participants.
- ENCCOM uses **Messaging Layer Security (MLS)** for private rooms, a protocol built specifically for end-to-end encrypted group messaging.
- Messages are **encrypted client side** before being sent to the server.
- The server only ever handles the **encrypted payload** plus the minimum metadata required for delivery. It relays messages without access to their plaintext or the users' encryption keys.

### Video Calls

Real time video communication via **WebRTC**.

- The backend never touches raw audio or video content.
- WebSocket handles **signaling only**, exchanging the info needed to establish the WebRTC connection.
- The media path is kept **fully separate** from the normal chat message path.

---

## Security Goals

The ENCCOM security model separates three distinct problems. Treating them as one leads to false claims of anonymity.

<div align="center">

| # | Goal | What It Covers |
|:---:|---|---|
| 1 | **Protecting message content** | Making the plaintext unreadable to the server |
| 2 | **Protecting user identity** | Avoiding unnecessary permanent identifiers |
| 3 | **Minimizing metadata** | Reducing what can be inferred even when content is encrypted |

</div>

> **Important:** End-to-end encryption protects message content. It does **not** automatically hide a sender's IP address, connection times, room activity, or other metadata. ENCCOM should never market itself as completely anonymous purely on the basis of using E2EE.

---

## Message Security

For private communication, the core goal is: **the server must not be able to read the plaintext of private messages.**

**Guiding principle:** use established cryptographic protocols. Never invent custom encryption.

| Use Case | Protocol | Why |
|---|---|---|
| Private rooms (group messaging) | **MLS** (Messaging Layer Security) | Built for end-to-end encrypted group messaging with scalable, changing membership |

MLS allows the server to relay encrypted messages without access to their plaintext or the users' encryption keys. The choice of library should prioritize reliable, well-maintained implementations over custom cryptography.

---

## Metadata Protection

> Metadata can reveal information even when message content is fully encrypted.

ENCCOM should minimize what metadata is collected and stored at all.

**Data that should be protected or minimized:**

<table>
<tr>
<td>

- IP addresses
- Connection identifiers
- Permanent user identifiers
- Device identifiers
- Account information
- Connection times
- Message timestamps, where not required

</td>
<td>

- Room membership information
- Message delivery relationships
- User presence and activity info
- WebRTC connection info, where possible
- Browser and device fingerprinting
- Logs that link multiple sessions together

</td>
</tr>
</table>

> **The golden rule:**
> ### If the server does not need a piece of information to provide the feature, it should not collect or retain it.

---

## Identity Protection

- ENCCOM avoids creating a **permanent identity** for anonymous users when a feature does not require one.
- For temporary sessions, identity is scoped to the **lifetime of the current browser session**.
- No unnecessary persistent identifiers. No permanent device IDs, no long lived tracking tokens.

> This does **not** make a user fully anonymous by itself. The server may still observe network level information such as IP address and connection timing. The objective is to make identity correlation **harder** by collecting less information from the start.

---

## Privacy Models by Feature

Each feature has a different privacy model. They should not be evaluated with the same lens.

### Public Chat Privacy

Anyone can read and participate, so hiding the message from the server is not the goal. Instead:

- Do not expose internal user identifiers, device identifiers, or tracking info to other users.
- Keep server side logs minimized.

### Private Room Privacy

```
  Member A     Member B     Member C                    Server
     │            │            │                            │
     │  Plaintext │            │                            │
     ▼            │            │                            │
┌─────────┐       │            │                            │
│ Encrypt │       │            │                            │
│ via MLS │       │            │                            │
└────┬────┘       │            │                            │
     │  Encrypted message      │                            │
     ├──────────── WebSocket ─────────────────────────────▶ │
     │            │            │                             │  relay only
     │            │            │                             │  no decryption keys
     │            │            │  ◀──────── WebSocket ───────┤
     │            │            │  Encrypted message
     │            │            ▼
     │            │       ┌─────────┐
     │            │       │ Decrypt │
     │            │       │ via MLS │
     │            │       └────┬────┘
     │            │            │  Plaintext
     │            │            ▼

     Membership (adding or removing a member) is handled through MLS group
     operations, so the server relays group changes without learning the
     group's encryption keys.
```

**Key rule:** the server never possesses the private keys required to decrypt messages, for any member. It acts purely as a **relay and service provider**, never as a trusted party for message content, even as room membership changes over time.

### Video Call Privacy

WebSocket handles signaling and connection setup. **WebRTC** handles the actual audio and video.

Metadata to carefully consider, a separate problem from protecting the media itself:

- Who is calling whom
- Call start and end times
- Connection information
- IP exposure through WebRTC
- TURN server logs, when a relay is required

> Protecting the **media content** and protecting the **call metadata** are two separate security problems. Solve both.

---

## Backend Security Checklist

E2EE does not protect against ordinary server-side vulnerabilities. Standard application security still applies:

- [ ] Input validation
- [ ] Authentication & authorization (where accounts exist)
- [ ] Rate limiting
- [ ] Protection against spam and abuse
- [ ] Secure WebSocket handling
- [ ] Secure Redis configuration
- [ ] Safe secret management
- [ ] Secure Docker configuration
- [ ] TLS for all client-server communication
- [ ] Log minimization
- [ ] Protection against message injection & malformed payloads
- [ ] Regular dependency and container updates

---

## Security Philosophy

> **Protect what needs to be private, collect what is necessary, and avoid creating information that can later be used for tracking.**

The server is never trusted with private message content. At the same time, ENCCOM recognizes that **encryption alone does not equal complete anonymity**.

### The Privacy Stack

```
        ┌───────────────────────────────┐
        │      Secure Session Mgmt       │
        ├───────────────────────────────┤
        │     Metadata Minimization      │
        ├───────────────────────────────┤
        │     Identity Minimization      │
        ├───────────────────────────────┤
        │     End to End Encryption      │
        ├───────────────────────────────┤
        │       Transport Security       │
        └───────────────────────────────┘
                        │
                        ▼
                Better Privacy
```

Each layer solves a different problem. Stacked together, they produce a realistic, not absolute, privacy guarantee.

---

## Roadmap

The project is evolving from a basic real-time Web2 chat into a privacy-focused messaging application, **while keeping the architecture understandable**.

| Status | Item |
|:---:|---|
| Done | Keep React, Flask, Redis, Socket.IO, and Docker |
| Done | Keep WebSockets for real-time communication |
| Planned | Add strong E2EE for private messaging |
| Planned | Use WebRTC for video calls |
| Planned | Minimize persistent identity information |
| Planned | Minimize stored metadata |
| Planned | Reduce unnecessary server logs |
| Planned | Avoid fingerprinting and unnecessary tracking |
| Planned | Use established cryptographic standards over custom cryptography |

**Non goals:** Web3, Waku, blockchain infrastructure

---

