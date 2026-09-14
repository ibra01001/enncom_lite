# How the MLS Chat Works & How We Fixed the Refresh Bug

A simple, beginner-friendly explanation of the problem, the solution, and what each file does.

---

## 1. The Problem (What happened when you refreshed?)

Imagine you and a friend are chatting in a private, secret room using invisible ink.

1. **Memory is wiped on refresh (The Whiteboard Problem):**
   The encryption engine (OpenMLS) runs inside your browser's WebAssembly (WASM) memory. Think of this like writing on a whiteboard. When you press **Refresh (F5)**, the browser wipes the whiteboard completely clean. Your keys, your group session, and your decrypted messages are gone.

2. **The Server had old, expired keys:**
   When you refresh, your browser generates new secret keys. But the server (Redis) still had your old expired keys from *before* the refresh. When someone tried to invite you, they used an old expired key, so your browser couldn't unlock the invitation.

3. **The Room Owner was stuck waiting for ghosts:**
   If you created the room and refreshed, you were alone in the room. You asked: *"Can someone in this room welcome me back?"* But nobody else was in the room! So you were stuck waiting forever, and the chat stayed locked on *"Awaiting Keys"*.

---

## 2. The Solution (How we fixed it step by step)

We fixed this with 4 simple steps:

### Step 1: Clean the Server Mailbox on Refresh
Whenever a user connects or refreshes, the server throws away old expired keys and only keeps the fresh ones. Now, when peers invite you, they always use a valid key that your browser can unlock.

### Step 2: Owner Auto-Recovery
When you refresh and enter your private room, the server tells your browser: *"You are the owner of this room, and nobody else is here right now."* 
Your browser immediately re-initializes the MLS encryption group. You can start typing and sending encrypted messages right away, without waiting for anyone.

### Step 3: Browser Storage (IndexedDB)
Instead of relying only on temporary memory (the whiteboard), we now save your user ID, room details, and past decrypted messages into **IndexedDB** (the browser's permanent notebook).
When you refresh, your past messages are loaded from IndexedDB so they still show up as readable text, not `[Encrypted Message]`.

### Step 4: A Visual Debugger Component
We built a friendly **MLS Inspector** panel directly into the chat header. You can click it anytime to see:
- Your identity and status.
- Whether encryption is active or waiting.
- Who is currently online in the room.
- A live log of encryption events and buttons to manually retry or re-sync if needed.

---

## 3. What Each File Does (File Guide)

Here is a quick look at the main files and what each one does:

### `backend/app.py` (The Post Office)
- Runs the Python Flask & Socket.IO server.
- Relays encrypted messages and invites between users.
- Stores rooms and key packages in Redis.
- Cleans up stale keys when users refresh and tracks who is currently online in each room.

### `App/src/utils/indexedDb.ts` (The Permanent Notebook)
- Connects to the browser's built-in `IndexedDB` database.
- Saves your User ID so it doesn't change on refresh.
- Saves which rooms you belong to and who owns them.
- Caches decrypted messages locally so you can read your chat history after refreshing.

### `App/src/context/MlsContext.tsx` (The Encryption Engine)
- The "brain" of the encryption on the frontend.
- Loads the WebAssembly encryption module (`openmls-wasm`).
- Creates keys, handles group creation, welcomes new users, and encrypts/decrypts messages.
- Saves group information to IndexedDB and records a live event log.

### `App/src/components/Chatbox.tsx` (The Chat Screen)
- The main chat window where you read and send messages.
- Checks if a room is private and whether encryption is ready.
- If you are the owner and refresh alone, it automatically recovers your group.
- Displays the **MLS Inspector** toggle button in the header.

### `App/src/components/MlsDebugger.tsx` (The Inspector Panel)
- The new side panel you see on the right of the chat.
- Displays your User ID, KeyPackage counts, room role (Owner vs Member), and current MLS Epoch.
- Has one-click action buttons: *"Request Welcome"*, *"Re-initialize Group"*, and *"Republish Keys"*.
- Shows a real-time terminal log of what the encryption engine is doing.

---

## 4. Simple Glossary of Technical Terms

| Term | What it means in plain English |
| :--- | :--- |
| **MLS** | *Messaging Layer Security*. A modern standard for end-to-end encryption in group chats. Unlike older methods, it allows groups of people to chat securely without slowing down as more people join. |
| **E2EE** | *End-to-End Encryption*. Only the sender and recipient can read the messages. Even the server owner cannot read what is sent. |
| **KeyPackage** | A public "one-time mailbox key". Before someone can invite you to an encrypted room, they need one of your KeyPackages to securely lock the invitation for you. |
| **Welcome Message** | The secret invitation packet sent to a new user. It contains the room secrets locked with the user's KeyPackage. |
| **Epoch** | A version number for the room's encryption state (e.g. Epoch 0, Epoch 1, Epoch 2). Every time someone joins, leaves, or updates keys, the epoch advances by 1. |
| **Ratchet Tree** | The mathematical tree structure that MLS uses to manage group keys efficiently among all members. |
| **IndexedDB** | A small, fast database built into your web browser (Chrome, Firefox, Safari). It allows websites to save data permanently on your device so it survives page reloads. |
| **Plaintext vs Ciphertext** | **Plaintext** is readable text (e.g. `"Hello!"`). **Ciphertext** is scrambled, unreadable encrypted data (e.g. `"8f2b9a...=="`). |
| **WASM (WebAssembly)** | A technology that lets high-performance code written in languages like Rust run directly inside the web browser at near-native speed. |
