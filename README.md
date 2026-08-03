# Realtime Chat App

*A simple Web2 chat app — the first step toward a decentralized messenger built with Waku.*

## About

This is a real-time chat application built as a learning project, not a finished product. It's step one on the way to a bigger goal: building a secure, decentralized messaging app using the **Waku protocol**.

Before jumping into Web3, it makes sense to first understand how a normal (Web2) chat app actually works — how the client talks to the server, how messages travel instantly between users, and how a real-time system fits together end to end.

Right now, users can join the app and exchange messages instantly, with a central server handling all communication over WebSockets.

## Goal

The point of this project is to learn the fundamentals of real-time communication before stacking more advanced concepts on top:

- How real-time messaging works (WebSockets vs. regular HTTP requests)
- How client-server architecture handles multiple connected users
- How a message flows from one user to another, instantly
- How to run a full-stack app consistently using Docker

## Tech Stack

**Frontend**

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

**Backend**

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

**Infrastructure**

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Running the App

```bash
docker-compose up --build
```

This builds and starts the frontend and backend together, so the app runs the same way every time — no need to install anything locally besides Docker.

## What's Next: Web2 → Web3

This project is simple on purpose. It's a stepping stone, not the final app. Once real-time messaging makes sense, the next version moves away from a central server entirely.

| Now (Web2) | Next (Web3) |
|---|---|
| Central Flask server | Decentralized, no central server |
| Socket.IO over WebSockets | Waku protocol |
| Plain messages | End-to-end encrypted messages |

**Coming up:**

- End-to-end encryption for messages
- Replacing the central server with the **Waku protocol** for decentralized, peer-to-peer messaging

## Note: For a Social Media App Specifically

Waku is a general-purpose messaging layer — great for chat, but it has no built-in concept of posts, follows, or a social graph. If this project eventually grows into a **social media app** rather than just a chat app, **Farcaster** is worth comparing first. It's a purpose-built decentralized social protocol with on-chain identity (anchored on Optimism) and a portable social graph, so followers and posts aren't locked into one app — and it's currently the most active, well-funded network of its kind, already powering real apps like Warpcast. (Lens Protocol is another blockchain-native social graph worth a glance, but Farcaster has the bigger ecosystem right now.)

Worth comparing before locking in a stack for the next version.
