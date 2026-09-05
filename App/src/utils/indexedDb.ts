/**
 * IndexedDB storage utility for client-side cryptographic persistence.
 * Database: enncom_mls_db (v1)
 */

export interface MlsIdentityRecord {
  id: 'current';
  clientToken: string;
  myId: string;
  createdAt: number;
  lastSeenAt: number;
  publishedKeyPackagesCount: number;
}

export interface MlsRoomRecord {
  roomId: string;
  name: string;
  owner: string;
  isOwner: boolean;
  epoch: number;
  hasGroup: boolean;
  ratchetTree?: string;
  lastWelcome?: string;
  updatedAt: number;
}

export interface MlsCachedMessage {
  id: string; // `${roomId}:${msgId}`
  roomId: string;
  senderId: string;
  text: string;
  ciphertext?: string;
  timestamp: number;
}

const DB_NAME = 'enncom_mls_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Identity Store
      if (!db.objectStoreNames.contains('identity_store')) {
        db.createObjectStore('identity_store', { keyPath: 'id' });
      }

      // 2. Rooms Store
      if (!db.objectStoreNames.contains('rooms_store')) {
        db.createObjectStore('rooms_store', { keyPath: 'roomId' });
      }

      // 3. Messages Store
      if (!db.objectStoreNames.contains('messages_store')) {
        const msgStore = db.createObjectStore('messages_store', { keyPath: 'id' });
        msgStore.createIndex('roomId', 'roomId', { unique: false });
        msgStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

// ============================================================================
// Identity Operations
// ============================================================================

export async function saveIdentity(data: Partial<MlsIdentityRecord>): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction('identity_store', 'readwrite');
    const store = tx.objectStore('identity_store');

    const existingReq = store.get('current');
    existingReq.onsuccess = () => {
      const existing = existingReq.result as MlsIdentityRecord | undefined;
      const record: MlsIdentityRecord = {
        id: 'current',
        clientToken: data.clientToken || existing?.clientToken || '',
        myId: data.myId || existing?.myId || '',
        createdAt: existing?.createdAt || Date.now(),
        lastSeenAt: Date.now(),
        publishedKeyPackagesCount:
          data.publishedKeyPackagesCount ?? existing?.publishedKeyPackagesCount ?? 0,
      };
      store.put(record);
    };
  } catch (err) {
    console.warn('[IndexedDB] saveIdentity error:', err);
  }
}

export async function getIdentity(): Promise<MlsIdentityRecord | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('identity_store', 'readonly');
      const store = tx.objectStore('identity_store');
      const req = store.get('current');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ============================================================================
// Room State Operations
// ============================================================================

export async function saveRoomState(record: MlsRoomRecord): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction('rooms_store', 'readwrite');
    const store = tx.objectStore('rooms_store');
    store.put({ ...record, updatedAt: Date.now() });
  } catch (err) {
    console.warn('[IndexedDB] saveRoomState error:', err);
  }
}

export async function getRoomState(roomId: string): Promise<MlsRoomRecord | null> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('rooms_store', 'readonly');
      const store = tx.objectStore('rooms_store');
      const req = store.get(roomId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function getAllRoomStates(): Promise<MlsRoomRecord[]> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('rooms_store', 'readonly');
      const store = tx.objectStore('rooms_store');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteRoomState(roomId: string): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(['rooms_store', 'messages_store'], 'readwrite');
    tx.objectStore('rooms_store').delete(roomId);

    // Also delete cached messages for this room
    const msgStore = tx.objectStore('messages_store');
    const index = msgStore.index('roomId');
    const req = index.getAllKeys(roomId);
    req.onsuccess = () => {
      for (const key of req.result) {
        msgStore.delete(key);
      }
    };
  } catch (err) {
    console.warn('[IndexedDB] deleteRoomState error:', err);
  }
}

// ============================================================================
// Decrypted Message Vault Operations
// ============================================================================

export async function saveCachedMessage(msg: MlsCachedMessage): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction('messages_store', 'readwrite');
    const store = tx.objectStore('messages_store');
    store.put(msg);
  } catch (err) {
    console.warn('[IndexedDB] saveCachedMessage error:', err);
  }
}

export async function getCachedMessages(roomId: string): Promise<MlsCachedMessage[]> {
  try {
    const db = await getDb();
    return new Promise((resolve) => {
      const tx = db.transaction('messages_store', 'readonly');
      const store = tx.objectStore('messages_store');
      const index = store.index('roomId');
      const req = index.getAll(roomId);
      req.onsuccess = () => {
        const msgs = (req.result || []) as MlsCachedMessage[];
        msgs.sort((a, b) => a.timestamp - b.timestamp);
        resolve(msgs);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function clearAllMlsStorage(): Promise<void> {
  try {
    const db = await getDb();
    const tx = db.transaction(['identity_store', 'rooms_store', 'messages_store'], 'readwrite');
    tx.objectStore('identity_store').clear();
    tx.objectStore('rooms_store').clear();
    tx.objectStore('messages_store').clear();
  } catch (err) {
    console.warn('[IndexedDB] clearAllMlsStorage error:', err);
  }
}
