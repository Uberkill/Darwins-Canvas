import type { WorldState, Creature, Plant } from '../types'

const DB_NAME = 'darwins-canvas-saves'
const STORE_NAME = 'slots'
const DB_VERSION = 1

export interface SaveSlotMetadata {
  id: string
  name: string
  lastSaved: number
  creatureCount: number
}

export interface SaveSlotData extends SaveSlotMetadata {
  creatures: Creature[]
  plants: Plant[]
  timeOfDay: number
  totalTime: number
  weather: 'CLEAR' | 'RAIN' | 'DROUGHT'
}

let dbPromise: Promise<IDBDatabase> | null = null

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        }
      }
    })
  }
  return dbPromise
}

export async function saveGame(slotId: string, world: WorldState, slotName: string): Promise<void> {
  const db = await getDB()
  
  // Create a deep copy using structured clone implicitly via IDB put.
  // We only extract the serializable core state, avoiding things like hoveredEntityId.
  const data: SaveSlotData = {
    id: slotId,
    name: slotName,
    lastSaved: Date.now(),
    creatureCount: world.creatures.length,
    creatures: world.creatures,
    plants: world.plants,
    timeOfDay: world.timeOfDay,
    totalTime: world.totalTime,
    weather: world.weather,
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(data)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

export async function loadGame(slotId: string): Promise<SaveSlotData | null> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(slotId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || null)
  })
}

export async function listSaves(): Promise<SaveSlotMetadata[]> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const saves = request.result as SaveSlotData[]
      // Return only metadata to avoid loading massive arrays into memory just for the Title Screen
      const metadata = saves.map(save => ({
        id: save.id,
        name: save.name,
        lastSaved: save.lastSaved,
        creatureCount: save.creatureCount,
      }))
      resolve(metadata)
    }
  })
}

export async function deleteGame(slotId: string): Promise<void> {
  const db = await getDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(slotId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
