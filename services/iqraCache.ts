import { IqraProgress } from '../types';
import { supabase } from './supabaseClient';

const DB_NAME = 'NurQuran_IqraCache';
const STORE_NAME = 'progress';
const DB_VERSION = 1;

// --- Helper: Get Auth User ID ---
const getAuthUserId = async () => {
    const { data } = await (supabase.auth as any).getUser();
    if (data.user) {
        return data.user.id;
    }
    // Fallback to local ID if not logged in
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

// --- Main Exported Functions (Robust Sync) ---

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
        console.warn("Supabase Network Error (Saved Locally)", e);
    }
};

export const getIqraProgress = async (level: number): Promise<IqraProgress | undefined> => {
    const all = await getAllIqraProgress();
    return all.find(p => p.level === level);
};

export const getAllIqraProgress = async (): Promise<IqraProgress[]> => {
    const localData = await getAllFromIndexedDB();
    
    try {
         const userId = await getAuthUserId();
         
         const { data, error } = await supabase
            .from('iqra_progress')
            .select('*')
            .eq('user_id', userId);
            
         if (!error && data) {
             const cloudData = data.map((d: any) => ({
                 level: d.level,
                 completed_pages: d.completed_pages,
                 accuracy: d.accuracy,
                 last_updated: d.last_updated || 0
             }));

             // Conflict Resolution: Merge based on 'last_updated'
             const allLevels = new Set([
                ...localData.map(d => d.level), 
                ...cloudData.map(d => d.level)
             ]);

             const mergedData: IqraProgress[] = [];

             for (const level of allLevels) {
                 const local = localData.find(d => d.level === level);
                 const cloud = cloudData.find(d => d.level === level);

                 if (local && cloud) {
                     // Both exist, check timestamp
                     if (cloud.last_updated > local.last_updated) {
                         // Cloud is newer, use cloud and update local
                         await saveToIndexedDB(cloud);
                         mergedData.push(cloud);
                     } else if (local.last_updated > cloud.last_updated) {
                         // Local is newer, use local and push to cloud
                         await supabase.from('iqra_progress').upsert({
                             user_id: userId,
                             level: local.level,
                             completed_pages: local.completed_pages,
                             accuracy: local.accuracy,
                             last_updated: local.last_updated
                         }, { onConflict: 'user_id, level' });
                         mergedData.push(local);
                     } else {
                         // Equal, defaults to local
                         mergedData.push(local);
                     }
                 } else if (cloud) {
                     // Only in cloud (new sync), save to local
                     await saveToIndexedDB(cloud);
                     mergedData.push(cloud);
                 } else if (local) {
                     // Only in local (offline progress), push to cloud
                     await supabase.from('iqra_progress').upsert({
                        user_id: userId,
                        level: local.level,
                        completed_pages: local.completed_pages,
                        accuracy: local.accuracy,
                        last_updated: local.last_updated
                    }, { onConflict: 'user_id, level' });
                     mergedData.push(local);
                 }
             }
             return mergedData;
         }
    } catch (e) {
        console.warn("Sync failed, utilizing local data", e);
    }
    
    return localData;
};