import { TimerSettings, Session } from '../types';

const DB_NAME = 'TimerraDB';
const DB_VERSION = 2;

// Fallback in-memory stores in case IndexedDB is blocked (e.g. private mode)
const inMemoryStore = {
  settings: null as TimerSettings | null,
  sessions: [] as Session[],
  subjects: ['Deep Work', 'Coding', 'Research', 'Design', 'Reading', 'Writing'] as string[],
};

function openDB(): Promise<IDBDatabase> {
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

      // Object Store for settings
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings');
      }

      // Object Store for study sessions
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        sessionStore.createIndex('completedAt', 'completedAt', { unique: false });
      }

      // Object Store for subjects
      if (!db.objectStoreNames.contains('subjects')) {
        db.createObjectStore('subjects', { keyPath: 'name' });
      }
    };
  });
}

export const TimerraDB = {
  async getSettings(): Promise<TimerSettings | null> {
    try {
      const db = await openDB();
      return await new Promise<TimerSettings | null>((resolve) => {
        try {
          const transaction = db.transaction('settings', 'readonly');
          const store = transaction.objectStore('settings');
          const request = store.get('main');
          request.onsuccess = () => resolve(request.result || null);
          request.onerror = () => resolve(inMemoryStore.settings);
        } catch {
          resolve(inMemoryStore.settings);
        }
      });
    } catch {
      return inMemoryStore.settings;
    }
  },

  async saveSettings(settings: TimerSettings): Promise<void> {
    inMemoryStore.settings = settings;
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction('settings', 'readwrite');
          const store = transaction.objectStore('settings');
          const request = store.put(settings, 'main');
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB warning: Settings saved in memory only', e);
    }
  },

  async addSession(session: Session): Promise<void> {
    inMemoryStore.sessions.push(session);
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction('sessions', 'readwrite');
          const store = transaction.objectStore('sessions');
          const request = store.add(session);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB warning: Session saved in memory only', e);
    }
  },

  async allSessions(): Promise<Session[]> {
    try {
      const db = await openDB();
      return await new Promise<Session[]>((resolve) => {
        try {
          const transaction = db.transaction('sessions', 'readonly');
          const store = transaction.objectStore('sessions');
          const index = store.index('completedAt');
          const request = index.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve(inMemoryStore.sessions);
        } catch {
          resolve(inMemoryStore.sessions);
        }
      });
    } catch {
      return inMemoryStore.sessions;
    }
  },

  async addSubject(name: string): Promise<void> {
    if (!inMemoryStore.subjects.includes(name)) {
      inMemoryStore.subjects.push(name);
    }
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction('subjects', 'readwrite');
          const store = transaction.objectStore('subjects');
          const request = store.put({ name });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB warning: Subject saved in memory only', e);
    }
  },

  async allSubjects(): Promise<string[]> {
    try {
      const db = await openDB();
      return await new Promise<string[]>((resolve) => {
        try {
          const transaction = db.transaction('subjects', 'readonly');
          const store = transaction.objectStore('subjects');
          const request = store.getAll();
          request.onsuccess = () => {
            const names = (request.result || []).map((r: any) => r.name);
            // Merge with default list to avoid empty state
            const merged = Array.from(new Set([...inMemoryStore.subjects, ...names]));
            resolve(merged);
          };
          request.onerror = () => resolve(inMemoryStore.subjects);
        } catch {
          resolve(inMemoryStore.subjects);
        }
      });
    } catch {
      return inMemoryStore.subjects;
    }
  },

  async deleteSubject(name: string): Promise<void> {
    inMemoryStore.subjects = inMemoryStore.subjects.filter(s => s !== name);
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction('subjects', 'readwrite');
          const store = transaction.objectStore('subjects');
          const request = store.delete(name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB warning: Subject deleted in memory only', e);
    }
  },

  async renameSubject(oldName: string, newName: string): Promise<void> {
    inMemoryStore.subjects = inMemoryStore.subjects.map(s => s === oldName ? newName : s);
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction('subjects', 'readwrite');
          const store = tx.objectStore('subjects');
          const deleteReq = store.delete(oldName);
          deleteReq.onsuccess = () => {
            const putReq = store.put({ name: newName });
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
          };
          deleteReq.onerror = () => reject(deleteReq.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB warning: Subject renamed in memory only', e);
    }
  },

  async clearAll(): Promise<void> {
    inMemoryStore.settings = null;
    inMemoryStore.sessions = [];
    inMemoryStore.subjects = ['Deep Work', 'Coding', 'Research', 'Design', 'Reading', 'Writing'];
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        try {
          const tx = db.transaction(['settings', 'sessions', 'subjects'], 'readwrite');
          tx.objectStore('settings').clear();
          tx.objectStore('sessions').clear();
          tx.objectStore('subjects').clear();
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        } catch (err) {
          reject(err);
        }
      });
    } catch (e) {
      console.warn('DB error on clear', e);
    }
  }
};
