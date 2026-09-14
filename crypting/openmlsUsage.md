# OpenMLS Integration Guide 

This guide explains how **OpenMLS (E2EE - End-to-End Encryption)** works in this project, and what needs to be added/updated in the **Frontend (React)** and **Backend (Flask + Redis)**.

---

##  How OpenMLS Works in Simple Terms

In OpenMLS:
1. **The Server is "Blind" (Zero-Knowledge):** The server never sees plaintext messages. It only passes encrypted bytes back and forth.
2. **Every User has a "KeyPackage":** Think of a `KeyPackage` as a public one-time mailbox key. Anyone who wants to invite you to a group needs your `KeyPackage`.
3. **Group Creation & Welcome:**
   - When **Alice** creates a group, she creates an MLS `Group`.
   - When Alice invites **Bob**, she asks the server for Bob's `KeyPackage`, adds him, and generates a **Welcome Package** (containing the encrypted group secrets + ratchet tree).
   - Bob receives the **Welcome Package** and joins the group.
4. **Chatting:**
   - When sending: React encrypts text into bytes (`create_message`) and sends it.
   - When receiving: React decrypts bytes into text (`process_message`).

---

##  1. Project Structure

The current structure in `App/src/pkg` is **already complete and ready**:
```text
App/src/pkg/
├── openmls_wasm_bg.wasm    # The compiled Rust encryption engine
├── openmls_wasm.js         # JavaScript bridge
└── openmls_wasm.d.ts       # TypeScript definitions (Provider, Identity, Group, etc.)
```

We **do not** need to change anything inside `App/src/pkg`.

---

##  2. Backend Changes (Flask & Redis)

The backend only needs to do **3 simple jobs**:

### Job A: Store and Serve `KeyPackage`s
When a user opens the app, they generate a `KeyPackage` and send it to the server. The server stores it in Redis so other users can fetch it.

* **Redis Key:** `user:<user_id>:keypackage`
* **Socket Event `publish_key_package`:**
  ```python
  @socketio.on('publish_key_package')
  def handle_publish_key(data):
      user_id = get_current_user_id()
      key_package_b64 = data.get('keyPackage')
      r.set(f"user:{user_id}:keypackage", key_package_b64)
  ```
* **Socket Event `get_key_package`:**
  ```python
  @socketio.on('get_key_package')
  def handle_get_key(data):
      target_user_id = data.get('userId')
      key_package_b64 = r.get(f"user:{target_user_id}:keypackage")
      emit('key_package_response', {'userId': target_user_id, 'keyPackage': key_package_b64})
  ```

### Job B: Relay `Welcome` Messages to Invited Users
When Alice adds Bob to a private room, she emits a `send_welcome` event with the room info and welcome data intended for Bob.

* **Socket Event `send_welcome`:**
  ```python
  @socketio.on('send_welcome')
  def handle_send_welcome(data):
      target_user = data.get('targetUserId')
      # Relay welcome directly to target user's active session socket(s)
      target_sids = active_sessions.get(target_user, set())
      for sid in target_sids:
          emit('mls_welcome', data, to=sid)
  ```

### Job C: Relay Encrypted Messages
Instead of sending plaintext strings in `msg['text']`, the client will send `msg['ciphertext']` (a Base64 string of encrypted bytes).

---

##  3. Frontend Changes (React + TypeScript)

### Step 1: Initialize Wasm and Setup MLS Context
Create a simple context (e.g. `App/src/context/MlsContext.tsx`):

```typescript
import init, { Provider, Identity, Group, KeyPackage, RatchetTree } from '../pkg/openmls_wasm';

// 1. Initialize WASM once when app starts
await init();

// 2. Create Provider and Identity for current user
const provider = new Provider();
const identity = new Identity(provider, myUsername);

// 3. Generate KeyPackage and publish to server
const keyPackage = identity.key_package(provider);
const keyPackageBytes = keyPackage.to_bytes();
const keyPackageB64 = btoa(String.fromCharCode(...keyPackageBytes));

socket.emit('publish_key_package', { keyPackage: keyPackageB64 });
```

### Step 2: Creating a Private Encrypted Room
```typescript
// Alice creates group
const group = Group.create_new(provider, identity, roomId);
// Store group in a Map: activeGroups.set(roomId, group)
```

### Step 3: Inviting a Member (e.g., Alice adds Bob)
```typescript
// 1. Ask backend for Bob's KeyPackage
socket.emit('get_key_package', { userId: 'bob_id' });

// 2. When received:
socket.on('key_package_response', ({ userId, keyPackage }) => {
  const bobKeyBytes = Uint8Array.from(atob(keyPackage), c => c.charCodeAt(0));
  const bobKeyPackage = KeyPackage.from_bytes(bobKeyBytes);

  // 3. Add Bob to the group
  const addMessages = group.propose_and_commit_add(provider, identity, bobKeyPackage);
  group.merge_pending_commit(provider);

  // 4. Export the current tree
  const tree = group.export_ratchet_tree();

  // 5. Send Welcome + Tree to Bob via socket
  socket.emit('send_welcome', {
    targetUserId: userId,
    roomId: roomId,
    welcome: btoa(String.fromCharCode(...addMessages.welcome)),
    tree: btoa(String.fromCharCode(...tree.to_bytes()))
  });
});
```

### Step 4: Bob Joins via Welcome Message
```typescript
socket.on('mls_welcome', ({ targetUserId, roomId, welcome, tree }) => {
  if (targetUserId !== myId) return;

  const welcomeBytes = Uint8Array.from(atob(welcome), c => c.charCodeAt(0));
  const treeBytes = Uint8Array.from(atob(tree), c => c.charCodeAt(0));
  const ratchetTree = RatchetTree.from_bytes(treeBytes);

  // Bob joins group using welcome & ratchet tree
  const joinedGroup = Group.join(provider, welcomeBytes, ratchetTree);
  activeGroups.set(roomId, joinedGroup);
});
```

### Step 5: Encrypting & Decrypting Chat Messages
* **Encrypting before sending (`Chatbox.tsx`):**
  ```typescript
  const plaintextBytes = new TextEncoder().encode(textMessage);
  const encryptedBytes = group.create_message(provider, identity, plaintextBytes);
  const ciphertextB64 = btoa(String.fromCharCode(...encryptedBytes));

  socket.emit('chat message', {
    room: currentRoom,
    ciphertext: ciphertextB64
  });
  ```

* **Decrypting when receiving (`Chatbox.tsx`):**
  ```typescript
  socket.on('chat message', (msg) => {
    if (msg.ciphertext && activeGroups.has(msg.room)) {
      const group = activeGroups.get(msg.room);
      const encryptedBytes = Uint8Array.from(atob(msg.ciphertext), c => c.charCodeAt(0));
      
      const decryptedBytes = group.process_message(provider, encryptedBytes);
      const plainText = new TextDecoder().decode(decryptedBytes);
      
      // Display decrypted text in UI
      displayMessage({ ...msg, text: plainText });
    }
  });
  ```

---

##  Summary Checklist

| Component | Tasks to Implement |
| :--- | :--- |
| **Wasm (`/pkg`)** | Already compiled and ready in `App/src/pkg/`. |
| **Backend (`app.py`)** | 1. Add `publish_key_package` and `get_key_package` handlers.<br>2. Add `send_welcome` relay handler.<br>3. Change message payload storage to store ciphertext. |
| **Frontend (`App`)** | 1. Call `init()` Wasm on startup.<br>2. Keep `Provider` & `Identity` in a context.<br>3. Publish `KeyPackage` on connect.<br>4. Run `create_message` on send and `process_message` on receive. |
