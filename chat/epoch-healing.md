# Epoch Healing — Owner Refresh Recovery

> **Status:** Fixed  
> **Affected role:** Room Owner only  
> **Symptom:** Owner epoch resets to `#0` on page refresh, disconnecting from active members  

---

## Background

This project uses **OpenMLS** — a Rust/WASM implementation of the MLS (Messaging Layer Security) protocol — for end-to-end encrypted group chat. Every time a member joins or leaves a room, the group performs a cryptographic **commit**, advancing the shared **epoch counter** by 1. All members must share the same epoch to encrypt/decrypt messages.

When the **owner** refreshed the page, their epoch always reset to `#0` while members stayed at `#N`, causing a complete cryptographic split. Members could refresh without any problem.

---

## Root Cause — A 3-Component Dead Loop

The bug was not in one place. It was a chain across three components that silently cancelled each other out.

### Stage 1 — Owner always recreated from scratch

On refresh, `Chatbox.tsx` called `recreateGroupAsOwner()`, which always called `Group.create_new()`:

```ts
// Before fix — Chatbox.tsx
if (data.mls_enabled && !hasGroup(data.room) && data.isOwner) {
  if (!data.activePeers || data.activePeers.length <= 1) {
    recreateGroupAsOwner(data.room); // ← always epoch 0, brand new group
  }
}
```

`Group.create_new()` starts a **completely new cryptographic group** with a fresh epoch `#0` — disconnected from all active members who are still in the old group at epoch `#N`. This is the equivalent of `git init` on a repo that already has active collaborators.

### Stage 2 — Recovery request hit a dead loop on the server

When `requestWelcome()` was called (asking a member to re-invite the owner), the server's `request_mls_welcome` handler always broadcast `peer_needs_welcome` with `designated_inviter = room_owner`:

```python
# Before fix — app.py
emit('peer_needs_welcome', {
    'peerId': user_id,
    'room': room,
    'owner': room_owner,
    'designated_inviter': room_owner  # ← always the owner, even when owner is the requester
}, to=room, include_self=False)
```

### Stage 3 — Members correctly refused to act

On the client, every member's `handlePeerNeedsWelcome` handler contains a guard to prevent invite race conditions:

```ts
// MlsContext.tsx — handlePeerNeedsWelcome
const roomOwner = data.designated_inviter || data.owner || ...;
if (roomOwner && myId && roomOwner !== myId) {
  return; // "I'm not the designated inviter, not my job"
}
```

This guard is **correct** for the normal case. But when the owner requested a welcome, `designated_inviter` was set to the owner — so every member checked `owner !== myId` → `true` → returned early. **Nobody ever sent the owner a welcome.** The owner stayed stuck at `[UNJOINED]` forever.

### The Full Dead Loop

```
Owner refreshes
  → recreateGroupAsOwner()    epoch resets to #0
  → requestWelcome()          asks a member to re-invite
      → Server broadcasts peer_needs_welcome
            designated_inviter = owner  (wrong)
        → Member A:  designated_inviter !== myId  → silent return
        → Member B:  designated_inviter !== myId  → silent return
        → ...no one responds
  → Owner stuck at epoch #0, [UNJOINED]
```

### Why members could refresh without issues

Members have `lastWelcome` + `ratchetTree` saved in IndexedDB from when they originally joined. On refresh, `Group.join()` can restore their exact cryptographic state at the saved epoch, then `get_missed_commits` catches up any commits that happened while they were offline. The owner never receives a welcome packet (they create the group), so they have no `lastWelcome` to restore from — making their refresh path fundamentally different.

---

## The Fix

Three targeted changes were applied, one per layer.

### Fix 1 — Server: Assign a member as designated inviter when owner requests welcome

**File:** `backend/app.py`

```python
# After fix
@socketio.on('request_mls_welcome')
def handle_request_welcome(data):
    ...
    if user_id == room_owner:
        # Owner is requesting — pick a non-owner active peer as the designated inviter
        active_users = list(r.smembers(f"room:{room}:active_users") or set())
        non_owner_peers = [u for u in active_users if u != user_id]
        designated = non_owner_peers[0] if non_owner_peers else room_owner
    else:
        designated = room_owner  # Normal case: owner invites members

    emit('peer_needs_welcome', {
        'peerId': user_id,
        'room': room,
        'owner': room_owner,
        'designated_inviter': designated  # ← now a real member when owner requests
    }, to=room, include_self=False)
```

The designated member receives `peer_needs_welcome`, passes the `designated_inviter === myId` guard, fetches the owner's new `KeyPackage`, runs `propose_and_commit_add`, and sends a proper `mls_welcome` back to the owner. The owner rejoins at the current epoch.

### Fix 2 — Client: 3-stage owner recovery cascade

**File:** `App/src/components/Chatbox.tsx`

Replaced the single `recreateGroupAsOwner()` call with a tiered cascade:

```
Stage B  → restoreGroupAsOwner()   Try to restore from IndexedDB saved state
Stage A  → requestWelcome()        If B fails: ask an active member to re-invite
Last     → recreateGroupAsOwner()  Only if alone in room with no state to restore
```

```ts
// After fix — Chatbox.tsx
if (data.mls_enabled && !hasGroup(data.room) && data.isOwner) {
  restoreGroupAsOwner(data.room).then((result) => {
    if (result === 'failed') {
      if (data.activePeers && data.activePeers.length > 1) {
        requestWelcome(data.room);       // Option A — peer re-invites owner
      } else {
        recreateGroupAsOwner(data.room); // Last resort — empty room, no state
      }
    }
  });
}
```

### Fix 3 — Context: `restoreGroupAsOwner` function

**File:** `App/src/context/MlsContext.tsx`

Added a new async function that attempts to restore an existing group from IndexedDB before falling back. For owners this always returns `'failed'` (they have no `lastWelcome`), which naturally cascades to Option A. For members with a saved welcome, this restores the group at the correct epoch directly.

```ts
const restoreGroupAsOwner = async (roomId): Promise<'restored' | 'failed'> => {
  const savedState = await getRoomState(roomId);
  if (!savedState?.lastWelcome || !savedState?.ratchetTree) return 'failed';

  const restoredGroup = Group.join(provider, welcomeBytes, ratchetTree);
  roomEpochsRef.current.set(roomId, savedState.epoch);
  socket.emit('get_missed_commits', { roomId, fromEpoch: savedState.epoch });
  return 'restored';
};
```

`recreateGroupAsOwner` was relabeled **LAST RESORT ONLY** internally with a warning log, making the intent clear.

---

## MLS Inspector UI Changes

**File:** `App/src/components/MlsDebugger.tsx`

The Controls panel was restructured to reflect the recovery hierarchy visually:

| Tier | Button | Action |
|------|--------|--------|
| Primary Recovery | **Restore from Cache** | Runs Option B → cascades to Option A on failure |
| Peer Recovery | **Request Welcome Packet** | Directly emits `request_mls_welcome` |
| Standard | **Synchronize Ratchet Epoch** | Fetches missed commits from current epoch |
| Standard | **Replenish KeyPackages** | Publishes 10 fresh key packages |
| ⚠ Danger Zone | **Force Re-initialize** | `recreateGroupAsOwner()` — resets epoch to 0, requires confirmation dialog |

The **Epoch** metric row now shows three states:
- `#N [SYNCED]` — group active and synchronized  
- `[RESTORING...]` — restore in progress (animated pulse)  
- `[UNJOINED]` — no active group session  

---

## Flow After Fix

```
Owner refreshes
  → restoreGroupAsOwner()
      → no lastWelcome in IndexedDB (owners never receive one) → 'failed'
  → requestWelcome()
      → Server: requester is owner → picks member as designated_inviter
      → Member receives peer_needs_welcome
          designated_inviter === myId → PASS guard
          → fetch owner's new KeyPackage
          → propose_and_commit_add → advance epoch
          → send mls_welcome to owner
      → Owner receives mls_welcome
          → Group.join() → restored at current epoch #N ✓
          → get_missed_commits catches up any remaining delta ✓
```

---

## Files Changed

| File | Change |
|------|--------|
| `backend/app.py` | `request_mls_welcome` handler — smart `designated_inviter` selection |
| `App/src/context/MlsContext.tsx` | Added `restoreGroupAsOwner`, relabeled `recreateGroupAsOwner` as last resort |
| `App/src/components/Chatbox.tsx` | 3-stage owner recovery cascade replaces single `recreateGroupAsOwner` call |
| `App/src/components/MlsDebugger.tsx` | Tiered Controls UI, cascading Restore button, dynamic Epoch badge |
