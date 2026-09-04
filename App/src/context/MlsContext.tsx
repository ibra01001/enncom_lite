import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import init, {
  Provider,
  Identity,
  Group,
  KeyPackage,
  RatchetTree,
} from '../pkg/openmls_wasm';
import { useSocket } from './SocketContext';
import { bytesToBase64, base64ToBytes } from '../utils/mlsUtils';

// ============================================================================
// PART 1: Context & Hook Definition
// ============================================================================

export interface MlsContextType {
  isInitialized: boolean;
  provider: Provider | null;
  identity: Identity | null;
  activeGroups: Map<string, Group>;
  createGroup: (roomId: string) => Group | null;
  joinGroupFromWelcome: (roomId: string, welcomeB64: string, treeB64: string) => Group | null;
  inviteUserToGroup: (
    roomId: string,
    targetUserId: string,
    targetKeyPackageB64: string
  ) => { welcome: string; tree: string } | null;
  encryptMessage: (roomId: string, plaintext: string) => string | null;
  decryptMessage: (roomId: string, ciphertextB64: string) => string | null;
  hasGroup: (roomId: string) => boolean;
  requestWelcome: (roomId: string) => void;
  getGroupEpoch: (roomId: string) => number;
}

const MlsContext = createContext<MlsContextType>({
  isInitialized: false,
  provider: null,
  identity: null,
  activeGroups: new Map(),
  createGroup: () => null,
  joinGroupFromWelcome: () => null,
  inviteUserToGroup: () => null,
  encryptMessage: () => null,
  decryptMessage: () => null,
  hasGroup: () => false,
  requestWelcome: () => { },
  getGroupEpoch: () => 0,
});

// Custom hook to consume MLS context across components
// eslint-disable-next-line react-refresh/only-export-components
export const useMls = (): MlsContextType => {
  return useContext(MlsContext);
};

interface MlsProviderProps {
  children: ReactNode;
}

export const MlsProvider = ({ children }: MlsProviderProps) => {
  const { socket, myId } = useSocket();

  // ============================================================================
  // PART 2: State & Reference Management
  // ============================================================================

  // Reactive state
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [activeGroups, setActiveGroups] = useState<Map<string, Group>>(new Map());

  // Mutable refs to prevent stale closures in async callbacks/socket handlers
  const groupsRef = useRef<Map<string, Group>>(activeGroups);
  const providerRef = useRef<Provider | null>(null);
  const identityRef = useRef<Identity | null>(null);
  const roomEpochsRef = useRef<Map<string, number>>(new Map());

  // Synchronize refs with state updates
  useEffect(() => {
    groupsRef.current = activeGroups;
  }, [activeGroups]);

  useEffect(() => {
    providerRef.current = provider;
  }, [provider]);

  useEffect(() => {
    identityRef.current = identity;
  }, [identity]);

  // ============================================================================
  // PART 3: Automated Lifecycle & Side Effects
  // ============================================================================

  // Effect A: Initialize WASM module, create Identity, and publish KeyPackage
  useEffect(() => {
    let isCancelled = false;

    async function initMls() {
      if (!myId) return;

      try {
        await init();
        if (isCancelled) return;

        let mlsProvider = providerRef.current;
        let mlsIdentity = identityRef.current;

        if (!mlsProvider) {
          mlsProvider = new Provider();
          setProvider(mlsProvider);
          providerRef.current = mlsProvider;
        }

        if (!mlsIdentity) {
          mlsIdentity = new Identity(mlsProvider, myId);
          setIdentity(mlsIdentity);
          identityRef.current = mlsIdentity;
        }

        setIsInitialized(true);

        // Publish KeyPackage pool (10 packages) to server once identity is ready
        if (socket) {
          const KEY_PACKAGE_POOL_SIZE = 10;
          const keyPackages: string[] = [];
          for (let i = 0; i < KEY_PACKAGE_POOL_SIZE; i++) {
            const kp = mlsIdentity.key_package(mlsProvider);
            keyPackages.push(bytesToBase64(kp.to_bytes()));
          }
          socket.emit('publish_key_packages', { keyPackages });
        }
      } catch (err) {
        console.error('Failed to initialize OpenMLS WASM or Identity:', err);
      }
    }

    initMls();

    return () => {
      isCancelled = true;
    };
  }, [myId, socket]);

  // Effect B: Listen for incoming 'mls_welcome' socket events to auto-join groups
  useEffect(() => {
    if (!socket || !provider) return;

    interface WelcomePayload {
      targetUserId: string;
      roomId: string;
      welcome: string;
      tree: string;
      epoch?: number;
    }

    const handleMlsWelcome = (data: WelcomePayload) => {
      // Defense-in-depth: Server now routes targeted to active sessions, but verify recipient matches
      if (data.targetUserId && data.targetUserId !== myId) return;

      try {
        const prov = providerRef.current;
        const ident = identityRef.current;
        if (!prov) return;

        const welcomeBytes = base64ToBytes(data.welcome);
        const treeBytes = base64ToBytes(data.tree);
        const ratchetTree = RatchetTree.from_bytes(treeBytes);

        const joinedGroup = Group.join(prov, welcomeBytes, ratchetTree);

        groupsRef.current.set(data.roomId, joinedGroup);
        roomEpochsRef.current.set(data.roomId, data.epoch ?? 1);
        setActiveGroups((prev) => {
          const updated = new Map(prev);
          updated.set(data.roomId, joinedGroup);
          return updated;
        });

        // Replenish our published KeyPackage pool for future room invites
        if (ident && socket) {
          const newKp = ident.key_package(prov);
          const newKpB64 = bytesToBase64(newKp.to_bytes());
          socket.emit('publish_key_packages', { keyPackages: [newKpB64] });
        }
      } catch (err) {
        console.error(`Failed to join MLS group for room ${data.roomId}:`, err);
      }
    };

    socket.on('mls_welcome', handleMlsWelcome);

    return () => {
      socket.off('mls_welcome', handleMlsWelcome);
    };
  }, [socket, myId, provider]);

  // Effect C: Listen for incoming 'mls_commit' socket events to update group epoch
  useEffect(() => {
    if (!socket || !provider) return;

    interface CommitPayload {
      roomId: string;
      commit: string;
      epoch?: number;
    }

    interface EpochConflictPayload {
      roomId: string;
      serverEpoch: number;
      attemptedEpoch?: number;
    }

    const handleMlsCommit = (data: CommitPayload) => {
      try {
        const prov = providerRef.current;
        const group = groupsRef.current.get(data.roomId);
        if (!prov || !group) return;

        const commitBytes = base64ToBytes(data.commit);
        group.process_message(prov, commitBytes);

        if (typeof data.epoch === 'number') {
          roomEpochsRef.current.set(data.roomId, data.epoch);
        } else {
          const current = roomEpochsRef.current.get(data.roomId) ?? 0;
          roomEpochsRef.current.set(data.roomId, current + 1);
        }

        setActiveGroups((prev) => new Map(prev));
      } catch (err) {
        // Ignored if commit was from our own add or already processed epoch
        console.debug(`MLS commit processed/ignored for room ${data.roomId}`);
      }
    };

    const handleEpochConflict = (data: EpochConflictPayload) => {
      console.warn(
        `[MLS] Epoch conflict in room ${data.roomId}: server at ${data.serverEpoch}, attempted ${data.attemptedEpoch}. Re-syncing...`
      );
      roomEpochsRef.current.set(data.roomId, data.serverEpoch);
      // Re-request welcome from peers to reconcile RatchetTree
      if (socket && data.roomId && data.roomId !== 'public') {
        socket.emit('request_mls_welcome', { roomId: data.roomId });
      }
    };

    socket.on('mls_commit', handleMlsCommit);
    socket.on('epoch_conflict', handleEpochConflict);

    return () => {
      socket.off('mls_commit', handleMlsCommit);
      socket.off('epoch_conflict', handleEpochConflict);
    };
  }, [socket, provider]);

  // Effect D: Listen for 'peer_joined' and automated KeyPackage handshake
  const invitedPeersRef = useRef<Set<string>>(new Set());
  const retryCountsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!socket || !provider) return;

    interface PeerJoinedPayload {
      peerId: string;
      room: string;
    }

    interface KeyPackageResponsePayload {
      userId: string;
      roomId?: string;
      keyPackage?: string;
    }

    // When an existing group member detects a new peer entering the room
    const handlePeerJoined = (data: PeerJoinedPayload) => {
      if (!data?.room || data.room === 'public' || data.peerId === myId) return;

      const inviteKey = `${data.room}:${data.peerId}`;
      if (invitedPeersRef.current.has(inviteKey)) return;

      const group = groupsRef.current.get(data.room);
      if (group) {
        // Fetch the new peer's KeyPackage to invite them
        socket.emit('get_key_package', {
          userId: data.peerId,
          roomId: data.room,
        });
      }
    };

    // When a peer signals they entered without keys (e.g. page refresh or reconnect)
    const handlePeerNeedsWelcome = (data: PeerJoinedPayload) => {
      if (!data?.room || data.room === 'public' || data.peerId === myId) return;

      const group = groupsRef.current.get(data.room);
      if (group) {
        // Clear previous invitation cache for this peer so they get invited with their new KeyPackage
        invitedPeersRef.current.delete(`${data.room}:${data.peerId}`);
        retryCountsRef.current.delete(`${data.room}:${data.peerId}`);
        socket.emit('get_key_package', {
          userId: data.peerId,
          roomId: data.room,
        });
      }
    };

    // When backend returns the requested KeyPackage for a peer
    const handleKeyPackageResponse = (data: KeyPackageResponsePayload) => {
      if (!data?.roomId || !data?.userId) return;

      const inviteKey = `${data.roomId}:${data.userId}`;
      if (invitedPeersRef.current.has(inviteKey)) return;

      // If the peer's KeyPackage was not yet published when queried, retry with exponential backoff
      if (!data.keyPackage) {
        const retries = retryCountsRef.current.get(inviteKey) || 0;
        const MAX_RETRIES = 3;
        if (retries < MAX_RETRIES) {
          retryCountsRef.current.set(inviteKey, retries + 1);
          const delay = Math.pow(2, retries) * 500; // 500ms, 1000ms, 2000ms
          setTimeout(() => {
            if (!invitedPeersRef.current.has(inviteKey) && groupsRef.current.has(data.roomId!)) {
              socket.emit('get_key_package', {
                userId: data.userId,
                roomId: data.roomId,
              });
            }
          }, delay);
        } else {
          console.warn(`Max retries reached fetching KeyPackage for peer ${data.userId} in room ${data.roomId}`);
        }
        return;
      }

      // Success: clean up retry counter
      retryCountsRef.current.delete(inviteKey);

      const group = groupsRef.current.get(data.roomId);
      const prov = providerRef.current;
      const ident = identityRef.current;

      if (group && prov && ident) {
        try {
          invitedPeersRef.current.add(inviteKey);

          const targetKeyBytes = base64ToBytes(data.keyPackage);
          const targetKeyPackage = KeyPackage.from_bytes(targetKeyBytes);

          const addMessages = group.propose_and_commit_add(prov, ident, targetKeyPackage);
          group.merge_pending_commit(prov);

          const tree = group.export_ratchet_tree();
          const welcomeB64 = bytesToBase64(addMessages.welcome);
          const treeB64 = bytesToBase64(tree.to_bytes());
          const commitB64 = bytesToBase64(addMessages.commit);

          const currentEpoch = roomEpochsRef.current.get(data.roomId) ?? 0;

          socket.emit('send_welcome', {
            targetUserId: data.userId,
            roomId: data.roomId,
            welcome: welcomeB64,
            tree: treeB64,
            epoch: currentEpoch + 1,
          });

          socket.emit('send_commit', {
            roomId: data.roomId,
            commit: commitB64,
            epoch: currentEpoch,
          });

          roomEpochsRef.current.set(data.roomId, currentEpoch + 1);
          setActiveGroups((prev) => new Map(prev));
        } catch (err) {
          console.error(`Failed to auto-invite peer ${data.userId} to room ${data.roomId}:`, err);
        }
      }
    };

    socket.on('peer_joined', handlePeerJoined);
    socket.on('peer_needs_welcome', handlePeerNeedsWelcome);
    socket.on('key_package_response', handleKeyPackageResponse);

    return () => {
      socket.off('peer_joined', handlePeerJoined);
      socket.off('peer_needs_welcome', handlePeerNeedsWelcome);
      socket.off('key_package_response', handleKeyPackageResponse);
    };
  }, [socket, provider, myId]);

  // ============================================================================
  // PART 4: Cryptographic Action Methods
  // ============================================================================

  // 1. Create a new encrypted MLS group for a room
  const createGroup = useCallback((roomId: string): Group | null => {
    const currentProvider = providerRef.current;
    const currentIdentity = identityRef.current;

    if (!currentProvider || !currentIdentity) {
      console.warn('MLS Provider or Identity not ready to create group');
      return null;
    }

    if (groupsRef.current.has(roomId)) {
      return groupsRef.current.get(roomId) ?? null;
    }

    try {
      const newGroup = Group.create_new(currentProvider, currentIdentity, roomId);
      groupsRef.current.set(roomId, newGroup);
      roomEpochsRef.current.set(roomId, 0);
      setActiveGroups((prev) => {
        const updated = new Map(prev);
        updated.set(roomId, newGroup);
        return updated;
      });
      return newGroup;
    } catch (err) {
      console.error(`Failed to create MLS group for room ${roomId}:`, err);
      return null;
    }
  }, []);

  // 2. Join an existing group using received Welcome + RatchetTree packages
  const joinGroupFromWelcome = useCallback(
    (roomId: string, welcomeB64: string, treeB64: string): Group | null => {
      const currentProvider = providerRef.current;
      if (!currentProvider) {
        console.warn('MLS Provider not ready to join group');
        return null;
      }

      try {
        const welcomeBytes = base64ToBytes(welcomeB64);
        const treeBytes = base64ToBytes(treeB64);
        const ratchetTree = RatchetTree.from_bytes(treeBytes);
        const joinedGroup = Group.join(currentProvider, welcomeBytes, ratchetTree);

        groupsRef.current.set(roomId, joinedGroup);
        setActiveGroups((prev) => {
          const updated = new Map(prev);
          updated.set(roomId, joinedGroup);
          return updated;
        });
        return joinedGroup;
      } catch (err) {
        console.error(`Failed to join group from welcome for room ${roomId}:`, err);
        return null;
      }
    },
    []
  );

  // 3. Add a new member to an existing group and emit welcome packet
  const inviteUserToGroup = useCallback(
    (
      roomId: string,
      targetUserId: string,
      targetKeyPackageB64: string
    ): { welcome: string; tree: string } | null => {
      const currentProvider = providerRef.current;
      const currentIdentity = identityRef.current;
      const group = groupsRef.current.get(roomId);

      if (!currentProvider || !currentIdentity || !group) {
        console.warn(`Cannot invite user: Provider, Identity, or Group (${roomId}) missing`);
        return null;
      }

      try {
        const targetKeyBytes = base64ToBytes(targetKeyPackageB64);
        const targetKeyPackage = KeyPackage.from_bytes(targetKeyBytes);

        const addMessages = group.propose_and_commit_add(
          currentProvider,
          currentIdentity,
          targetKeyPackage
        );
        group.merge_pending_commit(currentProvider);

        const tree = group.export_ratchet_tree();
        const welcomeB64 = bytesToBase64(addMessages.welcome);
        const treeB64 = bytesToBase64(tree.to_bytes());
        const commitB64 = bytesToBase64(addMessages.commit);

        if (socket) {
          const currentEpoch = roomEpochsRef.current.get(roomId) ?? 0;

          // Send Welcome + RatchetTree to the new member
          socket.emit('send_welcome', {
            targetUserId,
            roomId,
            welcome: welcomeB64,
            tree: treeB64,
            epoch: currentEpoch + 1,
          });

          // Broadcast Commit to existing members so their ratchet tree / epoch stays in sync
          socket.emit('send_commit', {
            roomId,
            commit: commitB64,
            epoch: currentEpoch,
          });

          roomEpochsRef.current.set(roomId, currentEpoch + 1);
        }

        return { welcome: welcomeB64, tree: treeB64 };
      } catch (err) {
        console.error(`Failed to invite user ${targetUserId} to room ${roomId}:`, err);
        return null;
      }
    },
    [socket]
  );

  // 4. Encrypt plaintext string into Base64 ciphertext
  const encryptMessage = useCallback((roomId: string, plaintext: string): string | null => {
    const currentProvider = providerRef.current;
    const currentIdentity = identityRef.current;
    const group = groupsRef.current.get(roomId);

    if (!currentProvider || !currentIdentity || !group) {
      return null;
    }

    try {
      const plaintextBytes = new TextEncoder().encode(plaintext);
      const ciphertextBytes = group.create_message(
        currentProvider,
        currentIdentity,
        plaintextBytes
      );
      return bytesToBase64(ciphertextBytes);
    } catch (err) {
      console.error(`Failed to encrypt message for room ${roomId}:`, err);
      return null;
    }
  }, []);

  // 5. Decrypt Base64 ciphertext back to plaintext string
  const decryptMessage = useCallback(
    (roomId: string, ciphertextB64: string): string | null => {
      const currentProvider = providerRef.current;
      const group = groupsRef.current.get(roomId);

      if (!currentProvider || !group) {
        return null;
      }

      try {
        const ciphertextBytes = base64ToBytes(ciphertextB64);
        const decryptedBytes = group.process_message(currentProvider, ciphertextBytes);

        // Non-application / control messages produce no decrypted text
        if (!decryptedBytes || decryptedBytes.length === 0) {
          return null;
        }

        return new TextDecoder('utf-8', { fatal: true }).decode(decryptedBytes);
      } catch (err) {
        console.error(`Failed to decrypt message for room ${roomId}:`, err);
        return null;
      }
    },
    []
  );

  // 6. Check if an active group session exists for a given room
  const hasGroup = useCallback((roomId: string): boolean => {
    return groupsRef.current.has(roomId);
  }, []);

  // 7. Request a welcome message from other room peers (e.g. after refresh)
  const requestWelcome = useCallback((roomId: string) => {
    if (!socket || !roomId || roomId === 'public') return;
    socket.emit('request_mls_welcome', { roomId });
  }, [socket]);

  // 8. Get current group epoch for a room
  const getGroupEpoch = useCallback((roomId: string): number => {
    return roomEpochsRef.current.get(roomId) ?? 0;
  }, []);

  const contextValue = useMemo(
    () => ({
      isInitialized,
      provider,
      identity,
      activeGroups,
      createGroup,
      joinGroupFromWelcome,
      inviteUserToGroup,
      encryptMessage,
      decryptMessage,
      hasGroup,
      requestWelcome,
      getGroupEpoch,
    }),
    [
      isInitialized,
      provider,
      identity,
      activeGroups,
      createGroup,
      joinGroupFromWelcome,
      inviteUserToGroup,
      encryptMessage,
      decryptMessage,
      hasGroup,
      requestWelcome,
      getGroupEpoch,
    ]
  );

  return (
    <MlsContext.Provider value={contextValue}>
      {children}
    </MlsContext.Provider>
  );
};