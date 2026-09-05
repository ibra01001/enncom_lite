# MLS 3+ User Group Chat Fix

## 1. What Was the Problem?
When 3 or more users joined the same room:
- Messaging failed with: `"Can't create message because a pending proposal exists."`
- Joining failed with: `"The computed tree hash does not match the one in the GroupInfo."`
- Users diverged into different epochs and could no longer decrypt each other's messages.

---

## 2. Why Did It Happen? (Root Causes)

1. **Everyone Raced to Invite:** Every existing member tried to invite newly joined peers simultaneously. This caused concurrent commits that collided on the server.
2. **Dropped Proposal Bytes:** The inviter made an Add proposal + commit, but only broadcast the commit to existing members. The proposal was discarded, so other members couldn't properly apply the commit.
3. **Premature Local Commit:** The inviter applied the commit locally before knowing if the server accepted it. If the server rejected it (epoch conflict), the inviter was left in a broken state with stuck proposals.
4. **Old Ratchet Tree Exported:** The inviter exported the ratchet tree *before* merging the commit. As a result, the tree didn't contain the new member yet, causing the tree hash mismatch error on the joiner.

---

## 3. What Was Fixed in OpenMLS (Rust / WASM)?

In [`openmls-wasm/src/lib.rs`](openmls-wasm/src/lib.rs):
- **Added `clear_pending_proposals`:** Lets JavaScript wipe orphaned proposals so users aren't blocked from sending messages.
- **Added `clear_pending_commit`:** Lets JavaScript cancel an unaccepted local commit without corrupting group state.
- **Automatic proposal cleanup:** If `commit_to_pending_proposals` fails, OpenMLS now automatically cleans up proposals instead of leaving them stuck in storage.

---

## 4. What Was Fixed in Backend & Frontend?

### Backend ([`backend/app.py`](backend/app.py))
- **Single Inviter Rule:** Server designates only the room **owner** as the inviter. Other peers do not trigger invites.
- **Commit Acknowledgement:** Added server ACKs to `send_commit` so the sender knows immediately if a commit was accepted or rejected.
- **Proposal Forwarding:** Relays proposal bytes alongside commit bytes.

### Frontend ([`App/src/context/MlsContext.tsx`](App/src/context/MlsContext.tsx))
- **Owner Only:** Only the room owner requests key packages and sends invites.
- **Wait for ACK:** Waits for server confirmation before merging local commits. If rejected, safely rolls back using `clear_pending_commit()`.
- **Export Tree After Merge:** Ratchet tree is exported *after* merging the commit, ensuring its hash matches the Welcome message.
- **Self-Healing Messages:** If a pending proposal ever blocks message creation, it is automatically cleared and retried.
