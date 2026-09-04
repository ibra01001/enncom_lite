# Backend Architecture & Reference (`mainbacken.md`)

## 1. Executive Summary

The **Enccom Lite Backend** is a lightweight, high-performance messaging relay and state coordinator built on **Python Flask-SocketIO** backed by **Redis**. It is specifically engineered to act as a **zero-knowledge blind relay** for end-to-end encrypted group communications using the **IETF Messaging Layer Security (MLS)** protocol (via `openmls-wasm`).

### Key Design Tenets
1. **Blind Server / Zero-Knowledge Relay**: The server coordinates routing, session membership, and MLS initialization primitives (KeyPackages, Welcome packets, RatchetTree commits), but possesses no knowledge of group encryption keys and cannot decrypt ciphertext.
2. **High Throughput & Pipelined Execution**: Redis network roundtrips are batched using `r.pipeline()` to eliminate $O(N)$ query loops and ensure sub-millisecond response times.
3. **Strict Permission & Room Boundaries**: Enforces cryptographic separation between public and private rooms. Protects room lifecycles by differentiating owners from guest participants.
4. **Native Cluster-Ready User Rooms**: Uses Socket.IO's native room clustering (`user:<user_id>`) for direct, secure event delivery without error-prone in-memory session dictionaries.

---

## 2. Redis Data Model & Schema

All persistent state is stored in Redis with an explicit TTL (Time-To-Live) of 24 hours (`86400` seconds) to maintain clean resource usage.

| Key Pattern | Redis Type | Purpose | TTL |
|---|---|---|---|
| `token:<client_token>:id` | `String` | Maps a client-provided persistent UUID token to a stable 6-character user ID (`short_id`). Survives server restarts. | 24h |
| `user:<user_id>:rooms` | `Set` | Set of room IDs that the user owns or has joined as a guest. | None |
| `chat:room:<room_name>` | `Hash` | Room metadata: `name` (string), `owner` (user_id), `created_at` (float timestamp), `mls_enabled` ("1" or "0"). | None |
| `chat:messages:<room_name>` | `List` | LIFO/FIFO message ring buffer (capped at the last 50 messages using `ltrim`). Stores JSON stringified message records. | 24h |
| `user:<user_id>:keypackages` | `List` | Pool of base64-encoded OpenMLS KeyPackages waiting to be consumed by peers wishing to add this user to an MLS group. | 24h |
| `room:<room_name>:epoch` | `String` | Optional epoch counter used to sequence and synchronize MLS group commits across peers. | 24h |

---

## 3. Socket.IO Event Reference

### 3.1 Connection & Identity

#### `connect`
- **Direction**: Client $\rightarrow$ Server
- **Query Param**: `client_token` (UUID v4)
- **Logic**:
  1. Resolves/creates stable `user_id` from `client_token`.
  2. Subscribes socket to native user room `user:<user_id>`.
  3. Emits `session_info` back to the client.
- **Server Response**:
  ```json
  // Event: 'session_info'
  {
    "myId": "a1b2c3"
  }
  ```

#### `disconnect`
- **Direction**: Client $\rightarrow$ Server
- **Logic**: Socket is automatically evicted from Socket.IO rooms by the engine.

---

### 3.2 Room Lifecycle & Membership

#### `create_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "name": "Project Alpha" }` (optional)
- **Logic**:
  1. Generates 8-char hex UUID `room_id` $\rightarrow$ `room_name = room_<room_id>`.
  2. Saves hash metadata in Redis (`owner = user_id`, `mls_enabled = "1"`).
  3. Adds room to creator's `user:<user_id>:rooms` set.
  4. Seeds initial system message.
  5. Joins socket to `room_name`.
- **Server Response**:
  ```json
  // Event: 'room_created'
  {
    "room": "room_3f8a12bc",
    "name": "Project Alpha",
    "owner": "a1b2c3"
  }
  ```

#### `get_my_rooms`
- **Direction**: Client $\rightarrow$ Server
- **Logic**:
  1. Retrieves `user:<user_id>:rooms`.
  2. Batches all room metadata requests in a **single pipelined Redis query**.
  3. **Auto-prunes dead/ghost rooms**: If a room was deleted by its owner, it is stripped from the user's set with `r.srem`.
  4. Always inserts `"public"` room as the primary entry.
  5. Sorts private rooms deterministically by creation time (newest first).
- **Server Response**:
  ```json
  // Event: 'rooms_list'
  {
    "rooms": [
      { "id": "public", "name": "Public Chat", "owner": "system", "mls_enabled": false },
      { "id": "room_3f8a12bc", "name": "Project Alpha", "owner": "a1b2c3", "mls_enabled": true, "created_at": 1725492000.0 }
    ]
  }
  ```

#### `update_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "room": "room_3f8a12bc", "name": "New Name" }`
- **Security**: Verifies caller is the registered `owner` in Redis. Rejects unauthorized requests silently.
- **Server Broadcast**: Emits `room_updated` to all sockets in the room.

#### `delete_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "room": "room_3f8a12bc" }`
- **Security & Role-Based Logic**:
  - **If Caller is Owner**: Destroys room metadata, messages list, and epoch in Redis. Broadcasts `room_deleted` to the entire room.
  - **If Caller is Guest (Leave Room)**: Removes room from caller's `user:<id>:rooms`, calls `leave_room()`, emits `peer_left` to remaining peers, and emits `room_deleted` only to the caller to clean their sidebar.

#### `join_room`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "room": "room_3f8a12bc" }`
- **Logic**:
  1. Validates room exists in Redis (rejects with `join_error` if missing).
  2. Adds room to user's persistent `user:<id>:rooms` set.
  3. Joins socket to the room.
  4. Emits `peer_joined` to existing room members so they can trigger MLS welcome exchanges.
  5. Emits `initial history` containing up to 50 latest messages.

---

### 3.3 Messaging & E2EE Relay

#### `chat message`
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```json
  {
    "room": "room_3f8a12bc",
    "text": "Hello world",        // Plaintext in public rooms
    "ciphertext": "BASE64...",    // Mandatory in private MLS rooms
    "clientMsgId": "temp-uuid"
  }
  ```
- **Security Enforcements**:
  1. **Payload Size Cap**: Rejects payloads $> 64\text{ KB}$ with `message_error`.
  2. **E2EE Ciphertext Enforcement**: In rooms with `mls_enabled = "1"`, rejects any message lacking a `ciphertext` payload.
  3. **Sender Attribution**: Strips client-provided `username` and stamps authoritative `senderId`.
- **Persistence**: Atomically `lpush`, `ltrim`, and `expire` to `chat:messages:<room>` via Redis pipeline.
- **Broadcast**: Emits `chat message` to all sockets in `room`.

---

### 3.4 OpenMLS Cryptographic Coordination Handlers

```
Alice                              Server                               Bob
  |                                  |                                   |
  |                                  |<-- publish_key_packages (pool) -- |
  |-- get_key_package(Bob) --------->|                                   |
  |<-- key_package_response (Bob) ---| (consumed via LPOP)               |
  |                                  |                                   |
  | (Alice creates Welcome + Commit) |                                   |
  |-- send_welcome(Bob, Welcome) --->|-- targeted emit: mls_welcome ---->|
  |-- send_commit(Commit) ---------->|-- broadcast: mls_commit --------->|
```

#### `publish_key_packages`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "keyPackages": ["base64_kp_1", "base64_kp_2", ...] }`
- **Logic**: Appends up to 50 KeyPackages to `user:<user_id>:keypackages` and trims pool depth to prevent memory exhaustion.

#### `get_key_package`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "userId": "b4e891", "roomId": "room_3f8a12bc" }`
- **Logic**: Pops **one** KeyPackage from `user:<target>:keypackages` via `LPOP` (enforcing MLS consume-once semantics).
- **Response**: Emits `key_package_response` to the requesting socket.

#### `send_welcome` (Targeted Session Delivery)
- **Direction**: Client $\rightarrow$ Server
- **Payload**:
  ```json
  {
    "targetUserId": "b4e891",
    "roomId": "room_3f8a12bc",
    "welcome": "<base64_welcome_bytes>",
    "tree": "<base64_ratchet_tree_bytes>"
  }
  ```
- **Privacy Enforcement**: Emits `mls_welcome` **only** to `to=f"user:{targetUserId}"`. Uninvolved room members never see or receive this payload.

#### `send_commit`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "roomId": "room_3f8a12bc", "commit": "<base64_commit_bytes>" }`
- **Logic**: Relays `mls_commit` to all other room members (`include_self=False`) to advance their RatchetTree epoch in lockstep.

#### `request_mls_welcome`
- **Direction**: Client $\rightarrow$ Server
- **Payload**: `{ "roomId": "room_3f8a12bc" }`
- **Logic**: Emits `peer_needs_welcome` to room peers when a client reconnects or clears local MLS storage.

---

## 4. Performance & Safety Audit Summary

| Risk / Vector | Old Implementation | New Pro Solution |
|---|---|---|
| **Redis N+1 Network Latency** | Sequential `r.hgetall` per room in `get_my_rooms`. | Pipelined batch fetch (`r.pipeline()`). $O(1)$ roundtrip. |
| **Zombie Rooms in Sidebar** | Deleted rooms remained in peers' Redis sets and crashed on click. | Auto-pruning during pipeline iteration via `r.srem`. |
| **Malicious Room Deletion** | Any joined guest could call `delete_room` and wipe room for all. | Strict ownership check: Owner destroys room; guest only leaves room. |
| **Plaintext Leak in E2EE Rooms** | Server stored/broadcast plaintext in private rooms without validation. | Strict gatekeeper: Rejects messages without `ciphertext` in `mls_enabled` rooms. |
| **Multi-Worker Routing** | In-memory `active_sessions` dictionary broke across multiple processes. | Native Socket.IO room routing (`to=f"user:{targetUserId}"`). |
| **DoS via Payload Bombing** | Unbounded message sizes and key package uploads. | Capped at 64KB message payload and 50 KeyPackages per user pool. |

---

## 5. Local Setup & Execution

### Running via Docker Compose
```bash
docker-compose up --build
```

### Running Manually
```bash
# 1. Start Redis
redis-server

# 2. Start Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install flask flask-socketio flask-cors redis
python3 app.py
```
Backend listens on `http://0.0.0.0:5000` with WebSocket support enabled.
