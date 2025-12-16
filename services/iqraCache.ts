import { IqraProgress } from '../types';
import { supabase } from './supabaseClient';

const DB_NAME = 'NurQuran_IqraCache';
const STORE_NAME = 'progress';
const DB_VERSION = 1;

// --- Helper: Get Auth User ID ---
const getAuthUserId = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) {
        return data.user.id;
    }
    // Fallback to local ID if not logged in (should be handled by App auth guard, but safe to keep)
    let id = localStorage.getItem('pulse_user_id');
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('pulse_user_id', id);
    }
    return id;
};

// --- Helper: IndexedDB Logic ---
const openIqraDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'level' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const saveToIndexedDB = async (progress: IqraProgress) => {
    const db = await openIqraDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(progress);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
};

const getAllFromIndexedDB = async (): Promise<IqraProgress[]> => {
    try {
        const db = await openIqraDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        return [];
    }
};

// --- Main Exported Functions (Hybrid Strategy) ---

export const saveIqraProgress = async (progress: IqraProgress) => {
    // 1. Always save locally first (Instant UI update)
    await saveToIndexedDB(progress);

    // 2. Try syncing to Cloud (Supabase)
    try {
        const userId = await getAuthUserId();
        const { error } = await supabase
            .from('iqra_progress')
            .upsert({ 
                user_id: userId,
                level: progress.level,
                completed_pages: progress.completed_pages,
                accuracy: progress.accuracy,
                last_updated: progress.last_updated
            }, { onConflict: 'user_id, level' });
            
        if (error) {
            console.warn("Supabase Sync Warning:", error.message);
        }
    } catch (e) {
        console.warn("Supabase Network Error", e);
    }
};

export const getIqraProgress = async (level: number): Promise<IqraProgress | undefined> => {
    // For single item fetch, just use local for speed
    const all = await getAllIqraProgress();
    return all.find(p => p.level === level);
};

export const getAllIqraProgress = async (): Promise<IqraProgress[]> => {
    const localData = await getAllFromIndexedDB();
    
    // Try fetch from cloud to sync
    try {
         const userId = await getAuthUserId();
         // If we are using the fallback local ID, don't fetch from Supabase unless we want to allow public read?
         // Assuming RLS protects data, fetching with local random ID won't return anything.
         
         const { data, error } = await supabase
            .from('iqra_progress')
            .select('*')
            .eq('user_id', userId);
            
         if (!error && data && data.length > 0) {
             // Map cloud data to app type
             const cloudProgress: IqraProgress[] = data.map((d: any) => ({
                 level: d.level,
                 completed_pages: d.completed_pages,
                 accuracy: d.accuracy,
                 last_updated: d.last_updated
             }));
             
             // Update local cache with cloud data
             for (const p of cloudProgress) {
                 await saveToIndexedDB(p);
             }
             return cloudProgress;
         }
    } catch (e) {
        console.warn("Using offline data", e);
    }
    
    return localData;
};
