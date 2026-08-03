# 🕵️ Anonymous Identity via Socket ID

> **Goal:** Give every user a unique, server-generated anonymous ID (`#xK9mP2`) for the duration of their session — no login, no username, no personal data. Just a short hash that tells users apart in a public chat.

---

## 📖 Background

### The Problem

Every user who sends a message is identified by a hardcoded string `'you'` set on the **client side**. This means:

- The server cannot tell two users apart
- Any client can send any username it wants (spoofing risk)
- All messages look like they come from the same person

### The Solution

Socket.IO automatically assigns a **unique session ID** (`socket.id`) to every connected client. We use this as the user's anonymous identity — stamped **by the server**, not the client.

```
Before:  Client sends { username: 'you', text: 'hello' }   ← untrusted
After:   Client sends { text: 'hello' }                    ← no identity
         Server emits { senderId: 'xK9mP2', text: 'hello' } ← server-stamped
```

---

## 🗂️ Files We Will Touch

| # | File | Role |
|---|------|------|
| 1 | `backend/app.py` | Server — stamps the sender ID |
| 2 | `App/src/context/SocketContext.jsx` | Context — exposes `myId` to all components |
| 3 | `App/src/components/Chatbox.jsx` | UI — sends clean messages, styles by identity |

---

## 🪜 Step 1 — Backend: Stamp the Identity on the Server

**File:** `backend/app.py`

### What to change

1. Import `request` from `flask` so we can access `request.sid`
2. Add a `connect` event handler to log new connections
3. Add a `disconnect` event handler to log departures
4. In `handle_message`:
   - Read `request.sid` and slice the first 6 characters → this is the `senderId`
   - Overwrite (or add) `senderId` in the message dict before broadcasting
   - Remove the `username` field from the message — we no longer need it
   - Switch to `include_self=True` so the **sender also receives the echoed message**

### Why `include_self=True`?

With the old approach, the client optimistically added its own message to local state immediately. Now, the client sends the message and **waits for the server echo**. This way:

- The sender ID is always server-stamped (no spoofing)
- Every client — including the sender — sees the **exact same data**

### Result

```python
from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print(f'connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'disconnected: {request.sid}')

@socketio.on('chat message')
def handle_message(msg):
    sender_id = request.sid[:6]          # short anonymous ID
    msg.pop('username', None)            # remove any client-sent username
    msg['senderId'] = sender_id          # stamp with server identity
    print(f'[{sender_id}] {msg["text"]}')
    emit('chat message', msg, broadcast=True, include_self=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)
```

---

## 🪜 Step 2 — Context: Expose `myId` to the App

**File:** `App/src/context/SocketContext.jsx`

### What to change

1. Track a `myId` state — initialized to `null`, set on `connect`
2. When the socket connects, slice the first 6 characters of `socket.id` → same logic as the server
3. Change the context value from just `socket` to `{ socket, myId }`
4. Update the `useSocket` hook — consumers will now destructure `{ socket, myId }`

### Result

```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [myId, setMyId] = useState(null);

    useEffect(() => {
        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

        newSocket.on('connect', () => {
            setMyId(newSocket.id.slice(0, 6));  // mirror the server's short ID logic
        });

        setSocket(newSocket);

        return () => newSocket.disconnect();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, myId }}>
            {children}
        </SocketContext.Provider>
    );
};
```

> **Note:** We slice `socket.id` on the frontend too — so the user can see their own ID and recognize their messages.

---

## 🪜 Step 3 — UI: Send Clean Messages, Style by Identity

**File:** `App/src/components/Chatbox.jsx`

### What to change

#### 3a — Update the `useSocket` destructure

```js
// Before
const socket = useSocket();

// After
const { socket, myId } = useSocket();
```

#### 3b — Send only `{ text }`, no username

```js
// Before
const newMsg = { id: nextId.current++, username: 'you', text: trimmed };
setMessages((prev) => [...prev, newMsg]);   // optimistic add
socket.emit('chat message', newMsg);

// After
socket.emit('chat message', { text: trimmed });  // server will stamp the ID
// Do NOT add to state here — wait for the server echo
```

#### 3c — Display `senderId` instead of `username`

```jsx
// Before
<span>{msg.username}</span>

// After
<span>#{msg.senderId}</span>
```

#### 3d — Style own messages differently

Compare `msg.senderId` against `myId` to decide layout:

```jsx
{messages.map((msg) => {
    const isOwn = msg.senderId === myId;
    return (
        <div key={msg.id} style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start' }}>
            <span>#{msg.senderId}</span>
            <p>{msg.text}</p>
        </div>
    );
})}
```

#### 3e — Show the user their own ID in the header

```jsx
<h4>#Public Chat</h4>
<span>You are #{myId ?? '...'}</span>
```

#### 3f — Update seed messages shape

Seed messages use `username` — change them to use `senderId` to match the new data shape.

```js
// Before
{ id: 1, username: 'devuser', text: '...' }

// After
{ id: 1, senderId: 'devusr', text: '...' }
```

---

## 🔄 Full Data Flow (After Changes)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BEFORE (broken)                          │
│                                                                 │
│  Tab A sends:  { username: 'you', text: 'hello' }              │
│  Tab B sends:  { username: 'you', text: 'hi' }                 │
│  Server sees:  two messages, both from 'you' ← SAME PERSON ❌  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        AFTER (fixed)                            │
│                                                                 │
│  Tab A sends:  { text: 'hello' }                               │
│  Server reads: request.sid[:6] = 'xK9mP2'                      │
│  Server emits: { senderId: 'xK9mP2', text: 'hello' }          │
│                                                                 │
│  Tab B sends:  { text: 'hi' }                                  │
│  Server reads: request.sid[:6] = 'rT5nW8'                      │
│  Server emits: { senderId: 'rT5nW8', text: 'hi' }             │
│                                                                 │
│  Both senders are distinct, server-verified ✅                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After applying all changes, rebuild with `docker compose up --build` and test:

- [ ] Open two browser tabs on `/chatbox`
- [ ] Each tab shows a **different** `You are #XXXXXX` in the header
- [ ] Send a message from Tab A → it appears **right-aligned** in Tab A, **left-aligned** in Tab B
- [ ] Send a message from Tab B → it appears **left-aligned** in Tab A, **right-aligned** in Tab B
- [ ] Run `docker compose logs backend` — two distinct `connected: <sid>` lines should appear
- [ ] Messages in the server log should show two different `senderId` values

---

## 🔐 Security Notes

| Risk | Mitigation |
|------|------------|
| Client sends a fake `senderId` | Server **ignores** any `senderId` from the client and always overwrites it with `request.sid[:6]` |
| User refreshes to get a new ID | Intentional — this is an anonymous, ephemeral session by design |
| Two users getting the same short ID | Extremely unlikely in small public chats; use `[:8]` if needed |

---

*Tutorial written for [enncom_lite](https://github.com/ibra01001/enncom_lite) — a lightweight anonymous public chat app.*
