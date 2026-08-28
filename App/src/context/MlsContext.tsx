import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
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

        const mlsProvider = new Provider();
        const mlsIdentity = new Identity(mlsProvider, myId);

        setProvider(mlsProvider);
        setIdentity(mlsIdentity);
        setIsInitialized(true);

        // Publish KeyPackage to server once identity is ready
        if (socket) {
          const keyPackage = mlsIdentity.key_package(mlsProvider);
          const keyPackageB64 = bytesToBase64(keyPackage.to_bytes());
          socket.emit('publish_key_package', { keyPackage: keyPackageB64 });
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
    }

    const handleMlsWelcome = (data: WelcomePayload) => {
      if (data.targetUserId !== myId) return;

      try {
        const prov = providerRef.current;
        if (!prov) return;

        const welcomeBytes = base64ToBytes(data.welcome);
        const treeBytes = base64ToBytes(data.tree);
        const ratchetTree = RatchetTree.from_bytes(treeBytes);

        const joinedGroup = Group.join(prov, welcomeBytes, ratchetTree);

        setActiveGroups((prev) => {
          const updated = new Map(prev);
          updated.set(data.roomId, joinedGroup);
          return updated;
        });
      } catch (err) {
        console.error(`Failed to join MLS group for room ${data.roomId}:`, err);
      }
    };

    socket.on('mls_welcome', handleMlsWelcome);

    return () => {
      socket.off('mls_welcome', handleMlsWelcome);
    };
  }, [socket, myId, provider]);

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

    try {
      const newGroup = Group.create_new(currentProvider, currentIdentity, roomId);
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

        if (socket) {
          socket.emit('send_welcome', {
            targetUserId,
            roomId,
            welcome: welcomeB64,
            tree: treeB64,
          });
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
        return new TextDecoder().decode(decryptedBytes);
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

  // ============================================================================
  // PART 5: Provider Rendering & Value Export
  // ============================================================================

  return (
    <MlsContext.Provider
      value={{
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
      }}
    >
      {children}
    </MlsContext.Provider>
  );
};