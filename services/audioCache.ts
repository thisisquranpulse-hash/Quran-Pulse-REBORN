const DB_NAME = 'NurQuran_AudioCache';
const STORE_NAME = 'verse_tts';
const DB_VERSION = 2; // Incremented version for schema change

export interface CachedAudioItem {
    id: number;
    verseKey: string;
    text: string;
    audio: string; // base64
    timestamp: number;
}

export interface CachedMetadata {
    id: number;
    verseKey: string;
    text: string;
    timestamp: number;
    size: number;
}

// Open (or create) the database
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Delete old store if exists to prevent schema conflict (simple migration)
      if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME);
      }
      
      // Create object store with 'id' as keyPath
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      // Create index for searching by verseKey if needed later
      store.createIndex('verseKey', 'verseKey', { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Save audio object to the database
export const saveAudio = async (item: CachedAudioItem): Promise<void> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(item);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("Error saving to cache", e);
    }
};

// Retrieve base64 audio string from the database by ID
export const getAudio = async (id: number): Promise<string | undefined> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => {
                const result = req.result as CachedAudioItem;
                resolve(result ? result.audio : undefined);
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("Error reading from cache", e);
        return undefined;
    }
};

// Retrieve audio item by verseKey (e.g. for Iqra or specific verse lookup)
export const getAudioByKey = async (key: string): Promise<CachedAudioItem | undefined> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('verseKey');
            const req = index.get(key);
            
            req.onsuccess = () => {
                resolve(req.result as CachedAudioItem | undefined);
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("Error reading from cache by key", e);
        return undefined;
    }
};

// Get list of all saved items (metadata only, without heavy audio string)
export const getAllCachedMetadata = async (): Promise<CachedMetadata[]> => {
    try {
        const db = await openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const items: CachedMetadata[] = [];
            
            const cursorRequest = store.openCursor();
            cursorRequest.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest).result as IDBCursorWithValue;
                if (cursor) {
                    const { id, verseKey, text, timestamp, audio } = cursor.value;
                    // Calculate approx size in bytes from base64 (3/4 of length)
                    const size = audio ? Math.round((audio.length * 3) / 4) : 0;
                    items.push({ id, verseKey, text, timestamp, size });
                    cursor.continue();
                } else {
                    // Sort by timestamp desc
                    items.sort((a, b) => b.timestamp - a.timestamp);
                    resolve(items);
                }
            };
            cursorRequest.onerror = () => reject(cursorRequest.error);
        });
    } catch (e) {
        console.error("Error fetching metadata", e);
        return [];
    }
};

// Delete specific item
export const deleteAudio = async (id: number): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};