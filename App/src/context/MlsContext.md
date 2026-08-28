# MLS Context Architecture & Explanation (`MlsContext.tsx`)

This document explains what `MlsContext.tsx` is, why it exists in our application, line-by-line breakdown of the first 35 lines, and a high-level structural breakdown of all parts of the code.

---

## 1. What is the Concept and Why Does this File Exist?

### The Problem:
In React, state in one component (e.g. `Navbar` or `Rooms`) is isolated from other components (like `Chatbox`). 

When implementing **End-to-End Encryption (E2EE) with OpenMLS**:
1. **WASM Module Loading:** The Rust WebAssembly module (`openmls_wasm`) must be compiled and loaded into browser memory **once**.
2. **Cryptographic Identity:** The user has an `Identity` and a `Provider` (cryptographic keystore) that must stay alive across page navigations.
3. **Active Group States:** When you join or create encrypted chat rooms, each room has its own cryptographic `Group` (with rotating ratchet trees, epoch secrets, and membership keys).
4. **No Prop-Drilling:** You don't want to pass encryption keys and WASM instances manually through 10 layers of React component props.

### The Solution: React Context (`MlsContext`):
`MlsContext.tsx` creates a **single, centralized cryptographic engine** for the entire React app:
* Automatically boots up WASM when the user connects.
* Automatically creates and publishes the user's `KeyPackage` to the server.
* Listens for incoming group invitations (`Welcome` messages) and joins rooms in the background.
* Provides simple hooks (`useMls()`) so any component can call `encryptMessage()`, `decryptMessage()`, `createGroup()`, or `inviteUserToGroup()`.

---

## 2. Line-by-Line Explanation of the First 35 Lines

Here is the exact breakdown of lines 1 to 35:

```typescript
1: import {
2:   createContext,
3:   useContext,
4:   useEffect,
5:   useState,
6:   useRef,
7:   useCallback,
8:   type ReactNode,
9: } from 'react';
```
* **`createContext` / `useContext`:** React tools to create a shared global data store and read from it anywhere in the component tree.
* **`useEffect`:** Runs side-effects (e.g., initializing WASM, setting up socket listeners, cleaning up).
* **`useState`:** Manages reactive state that triggers UI re-renders when updated (e.g., `isInitialized`, `activeGroups`).
* **`useRef`:** Keeps mutable, persistent references to cryptographic objects (`Provider`, `Identity`, `Group` instances) without triggering unwanted re-renders.
* **`useCallback`:** Memoizes encryption/decryption functions so they don't get recreated on every render.
* **`type ReactNode`:** TypeScript type representing any valid React child element (components, JSX, strings, numbers).

```typescript
10: import init, {
11:   Provider,
12:   Identity,
13:   Group,
14:   KeyPackage,
15:   RatchetTree,
16: } from '../pkg/openmls_wasm';
```
* **`init`:** The default function that downloads, compiles, and initializes the Rust WebAssembly binary in the browser.
* **`Provider`:** The OpenMLS cryptographic provider (manages the crypto backend, random number generator, and key store).
* **`Identity`:** Represents the local user's cryptographic credential and signing keys.
* **`Group`:** Represents an active MLS encrypted chat room. Handles encryption (`create_message`) and decryption (`process_message`).
* **`KeyPackage`:** The user's public one-time key package that allows other users to invite them to groups.
* **`RatchetTree`:** The tree structure representing all members and their public keys in an MLS group.

```typescript
17: import { useSocket } from './SocketContext';
18: import { bytesToBase64, base64ToBytes } from '../utils/mlsUtils';
```
* **`useSocket`:** Imports the socket connection and `myId` from our `SocketContext` so MLS knows who the current user is and can communicate over WebSockets.
* **`bytesToBase64`, `base64ToBytes`:** Utility functions to convert between raw binary bytes (`Uint8Array`) used by WASM and Base64 strings sent over WebSockets.

```typescript
20: export interface MlsContextType {
21:   isInitialized: boolean;
22:   provider: Provider | null;
23:   identity: Identity | null;
24:   activeGroups: Map<string, Group>;
25:   createGroup: (roomId: string) => Group | null;
26:   joinGroupFromWelcome: (roomId: string, welcomeB64: string, treeB64: string) => Group | null;
27:   inviteUserToGroup: (
28:     roomId: string,
29:     targetUserId: string,
30:     targetKeyPackageB64: string
31:   ) => { welcome: string; tree: string } | null;
32:   encryptMessage: (roomId: string, plaintext: string) => string | null;
33:   decryptMessage: (roomId: string, ciphertextB64: string) => string | null;
34:   hasGroup: (roomId: string) => boolean;
35: }
```
This is the TypeScript **Contract / Interface** defining everything that the `MlsContext` exposes to the rest of the application:
* **`isInitialized`:** Boolean indicating whether OpenMLS WASM and identity are ready.
* **`provider`:** The active cryptographic provider instance.
* **`identity`:** The active user's MLS identity.
* **`activeGroups`:** A `Map<roomId, Group>` of all encrypted rooms the user is currently participating in.
* **`createGroup(roomId)`:** Function to initialize a new encrypted group.
* **`joinGroupFromWelcome(roomId, welcomeB64, treeB64)`:** Function to join an existing group when invited.
* **`inviteUserToGroup(roomId, targetUserId, targetKeyPackageB64)`:** Function to add another user to an existing room and emit their welcome packet.
* **`encryptMessage(roomId, plaintext)`:** Encrypts a message into Base64 ciphertext.
* **`decryptMessage(roomId, ciphertextB64)`:** Decrypts a Base64 ciphertext back to readable text.
* **`hasGroup(roomId)`:** Checks if a group session exists for a specific room ID.

---

## 3. Simplified Architecture & Structural Breakdown

The file is organized into **5 logical building blocks**:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Context & Hook Definition                                │
│    - createContext<MlsContextType>()                        │
│    - useMls() hook                                          │
├─────────────────────────────────────────────────────────────┤
│ 2. State & Reference Management                             │
│    - State: isInitialized, provider, identity, activeGroups │
│    - Refs: providerRef, identityRef, groupsRef              │
├─────────────────────────────────────────────────────────────┤
│ 3. Automated Lifecycle & Side Effects                       │
│    - Effect A: Init WASM + Identity + Publish KeyPackage    │
│    - Effect B: Listen for 'mls_welcome' Socket Events       │
├─────────────────────────────────────────────────────────────┤
│ 4. Cryptographic Action Methods                             │
│    - createGroup()                                          │
│    - joinGroupFromWelcome()                                 │
│    - inviteUserToGroup()                                    │
│    - encryptMessage()                                       │
│    - decryptMessage()                                       │
│    - hasGroup()                                             │
├─────────────────────────────────────────────────────────────┤
│ 5. Provider Rendering & Value Export                        │
│    - <MlsContext.Provider value={...}>                      │
└─────────────────────────────────────────────────────────────┘
```

### Part 1: Context & Hook Definition
* **`MlsContext`**: The React context initialized with safe default fallback values.
* **`useMls()`**: A custom hook that any React component (like `Chatbox`) can call (`const { encryptMessage, decryptMessage } = useMls();`) to access MLS features easily.

### Part 2: State & Reference Management
* Keeps track of active states (`provider`, `identity`, `activeGroups`, `isInitialized`).
* Uses **Refs** (`providerRef`, `identityRef`, `groupsRef`) so async callbacks and socket event handlers always read the freshest cryptographic state without creating stale closures.

### Part 3: Automated Lifecycle & Socket Effects
* **WASM Bootstrapping & Key Registration:** When the user connects and gets an ID (`myId`), this automatically loads the WASM engine, creates `Provider` and `Identity`, derives a `KeyPackage`, and publishes it to the backend via `publish_key_package`.
* **Welcome Listener:** Automatically listens on the WebSocket for `mls_welcome` events sent by other users. When an invitation arrives, it parses the `RatchetTree` and `Welcome` payload, joins the group, and saves the new `Group` instance into `activeGroups`.

### Part 4: Cryptographic Action Methods
* **`createGroup`:** Used when Alice creates a room. Initializes an MLS `Group.create_new(...)`.
* **`inviteUserToGroup`:** Used when Alice adds Bob. Converts Bob's `KeyPackage`, runs `propose_and_commit_add`, merges commits, exports the updated `RatchetTree`, and broadcasts the welcome packet.
* **`joinGroupFromWelcome`:** Manual helper to join a group using welcome & ratchet tree payloads.
* **`encryptMessage`:** Converts plaintext strings to UTF-8 bytes, encrypts them via `group.create_message`, and returns a Base64 ciphertext.
* **`decryptMessage`:** Converts Base64 ciphertext to bytes, decrypts via `group.process_message`, and decodes back to UTF-8 plaintext.
* **`hasGroup`:** Quick boolean check to see if an encrypted session is ready for a room.

### Part 5: Provider Component (`<MlsProvider>`)
* Wraps child components and supplies all cryptographic methods and states through `<MlsContext.Provider value={{ ... }}>{children}</MlsContext.Provider>`.

---

## 4. How Other Components Use This File

```tsx
import { useMls } from '../context/MlsContext';

function Chatbox() {
  const { encryptMessage, decryptMessage, hasGroup } = useMls();

  // Sending an encrypted message:
  const handleSend = (text: string) => {
    const ciphertextB64 = encryptMessage('room-123', text);
    socket.emit('chat message', { room: 'room-123', ciphertext: ciphertextB64 });
  };

  // Decrypting an incoming message:
  const handleIncoming = (ciphertextB64: string) => {
    const plaintext = decryptMessage('room-123', ciphertextB64);
    console.log('Decrypted message:', plaintext);
  };
}
```
