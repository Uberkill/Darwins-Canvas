import type { CreatureSize, MovementType, DietType, Decal } from '../../types';

const DB_NAME = 'DarwinCollectionDB';
const DB_VERSION = 2;
const STORE_META = 'collection_meta';
const STORE_BLOBS = 'collection_blobs';

import type { LoreProfile } from '../../utils/loreGenerator';

export interface CollectionMeta {
  id: string;
  catalogId?: number; // Added for immutable Pokédex-style numbering
  name: string;
  size: CreatureSize;
  movement: MovementType;
  diet: DietType;
  dateSaved: number;
  kills?: number;
  foodEaten?: number;
  ageAtSave?: number;
  loreProfile?: LoreProfile;
  userNotes?: string;
}

export interface CollectionBlob {
  id: string;
  drawingData: string;
  decals: Decal[];
  bakedSprites?: {
    IDLE: string;
    SLEEPING: string;
    EATING: string;
    FIGHTING: string;
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function getCollectionDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS, { keyPath: 'id' });
        }
      };
    });
  }
  return dbPromise;
}

export async function saveToCollection(creature: any, loreProfile?: LoreProfile): Promise<void> {
  const db = await getCollectionDB();
  
  // Fetch existing to determine the next catalogId
  const existingMeta = await getCollectionMetadata();
  const maxCatalogId = existingMeta.reduce((max, item) => Math.max(max, item.catalogId || 0), 0);
  const nextCatalogId = maxCatalogId + 1;

  // Generate a unique ID so we can save the same creature multiple times if we want
  const uniqueId = `collect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const meta: CollectionMeta = {
    id: uniqueId,
    catalogId: nextCatalogId,
    name: creature.name,
    size: creature.size,
    movement: creature.movement,
    diet: creature.diet,
    dateSaved: Date.now(),
    kills: creature.kills || 0,
    foodEaten: creature.foodEaten || 0,
    ageAtSave: creature.age || 0,
    loreProfile: loreProfile,
    userNotes: ''
  };
  
  const blob: CollectionBlob = {
    id: uniqueId,
    drawingData: creature.drawingData,
    decals: creature.decals || [],
    bakedSprites: creature.bakedSprites
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_META, STORE_BLOBS], 'readwrite');
    const metaStore = transaction.objectStore(STORE_META);
    const blobStore = transaction.objectStore(STORE_BLOBS);
    
    metaStore.put(meta);
    blobStore.put(blob);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getCollectionMetadata(): Promise<CollectionMeta[]> {
  const db = await getCollectionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_META, 'readonly');
    const store = transaction.objectStore(STORE_META);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const items = request.result as CollectionMeta[];
      // Sort by newest first
      items.sort((a, b) => b.dateSaved - a.dateSaved);
      resolve(items);
    };
  });
}

export async function getCollectionBlob(id: string): Promise<CollectionBlob | null> {
  const db = await getCollectionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_BLOBS, 'readonly');
    const store = transaction.objectStore(STORE_BLOBS);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function deleteFromCollection(id: string): Promise<void> {
  const db = await getCollectionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_META, STORE_BLOBS], 'readwrite');
    const metaStore = transaction.objectStore(STORE_META);
    const blobStore = transaction.objectStore(STORE_BLOBS);
    
    metaStore.delete(id);
    blobStore.delete(id);
    
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function updateUserNotes(id: string, notes: string): Promise<void> {
  const db = await getCollectionDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_META, 'readwrite');
    const metaStore = transaction.objectStore(STORE_META);
    const getReq = metaStore.get(id);

    getReq.onerror = () => reject(getReq.error);
    getReq.onsuccess = () => {
      const data = getReq.result as CollectionMeta;
      if (data) {
        data.userNotes = notes;
        const putReq = metaStore.put(data);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      } else {
        reject(new Error('Record not found'));
      }
    };
  });
}
