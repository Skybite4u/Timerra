export interface SavedCapsule {
  id: string; // unique ID
  filename: string;
  createdAt: number;
  lastModified: number;
  fileSize: number; // in bytes
  deviceName: string;
  appVersion: string;
  theme: string;
  focusHours: number;
  completedSessionsCount: number;
  taskCount: number;
  isEncrypted: boolean;
  capsuleData: string; // The full JSON string of the tmcapsule
}

const DB_NAME = 'TimerraCapsuleVault';
const STORE_NAME = 'capsules';
const DB_VERSION = 1;

function openCapsuleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (e) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export const CapsuleDB = {
  async getAll(): Promise<SavedCapsule[]> {
    try {
      const db = await openCapsuleDB();
      return await new Promise<SavedCapsule[]>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('CapsuleDB load error, fallback empty', e);
      return [];
    }
  },

  async save(capsule: SavedCapsule): Promise<void> {
    try {
      const db = await openCapsuleDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.put(capsule);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to save capsule', e);
      throw e;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const db = await openCapsuleDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.error('Failed to delete capsule', e);
      throw e;
    }
  }
};
