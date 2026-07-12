import { random } from './random';
import type { WorldState } from '../types'
import { SpatialGrid } from './SpatialGrid'
import { getWorldWidth, getWorldHeight, BASE_RENDER_SIZE, CAMERA_TILT } from '../constants'

/**
 * worldRef — the mutable, single source of truth for all simulation state.
 *
 * This is a plain JS object reference — NOT React state, NOT Zustand.
 * The simulation loop reads and mutates worldRef.current directly at 60fps.
 * The renderer also reads from worldRef.current directly.
 *
 * React never touches this object. Zero re-renders during gameplay.
 * Zustand only receives commands (add creature, open panel) — never raw state.
 */
export const worldRef: { current: WorldState } = {
  current: createInitialWorldState(),
}

function createInitialWorldState(): WorldState {
  return {
    creatures:           [],
    plants:              [],
    plantSpawnTimer:     0,
    totalTime:           0,
    worldWidth:          getWorldWidth(),
    worldHeight:         getWorldHeight(),
    mapSizeMultiplier:   1,
    mouseX:              -1000,
    mouseY:              -1000,
    hoveredEntityId:     null,
    activeLure:          null,
    flags:               { boundsChanged: false, terrainChanged: false },
    timeOfDay:           0.1,
    weather:             'CLEAR',
    camera: {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
      // camera.y is in visual space (world y * CAMERA_TILT).
      // Since worldHeight is scaled by 1/CAMERA_TILT, visual height is exactly innerHeight.
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 120,
      zoom: typeof window !== 'undefined' ? 1.0 : 1.0,
    },
    scratchpad: {
      deletedCreatureIds: new Set(),
      deletedPlantIds: new Set(),
      spatialGrid: new SpatialGrid(800, 600, 100),
    },
    draggedEntityId: null,
    isPaused: false,
    analytics: {
      currentSecondAccumulator: {
        birthsCarn: 0, birthsOmni: 0, birthsHerb: 0,
        starvationCarn: 0, starvationOmni: 0, starvationHerb: 0,
        huntedCarn: 0, huntedOmni: 0, huntedHerb: 0,
        damageCarn: 0, damageOmni: 0, damageHerb: 0,
        caloriesCarn: 0, caloriesOmni: 0, caloriesHerb: 0,
      },
      history: []
    },
    historyTimer: 0,
  }
}

export function updateWorldDimensions(): void {
  const mult = worldRef.current.mapSizeMultiplier || 1
  const newW = getWorldWidth() * mult
  const newH = getWorldHeight() * mult
  
  if (worldRef.current.worldWidth !== newW || worldRef.current.worldHeight !== newH) {
    worldRef.current.worldWidth = newW
    worldRef.current.worldHeight = newH
    worldRef.current.flags.boundsChanged = true
    worldRef.current.flags.terrainChanged = true
    initializeTerrain(worldRef.current)
  }
}

/** Explicitly load a fixed-size world from a save file */
export function setWorldDimensions(w: number, h: number): void {
  if (worldRef.current.worldWidth !== w || worldRef.current.worldHeight !== h) {
    worldRef.current.worldWidth = w
    worldRef.current.worldHeight = h
    worldRef.current.flags.boundsChanged = true
    worldRef.current.flags.terrainChanged = true
    initializeTerrain(worldRef.current)
  }
}

/** Recenter the camera on the world. */
export function centerCamera(): void {
  // camera.x is in physical space, camera.y is in VISUAL space (squished by tilt)
  worldRef.current.camera.x = worldRef.current.worldWidth / 2;
  worldRef.current.camera.y = (worldRef.current.worldHeight / 2) * CAMERA_TILT;
}

/** Computes the zoom required for the world to fill the browser window. */
export function getAutoFitZoom(): number {
  if (typeof window === 'undefined') return 1.0;
  const w = worldRef.current.worldWidth;
  const h = worldRef.current.worldHeight * CAMERA_TILT;
  
  const zoomX = window.innerWidth / w;
  const zoomY = window.innerHeight / h;
  const requiredZoom = Math.max(zoomX, zoomY);
  
  return requiredZoom > 1.0 ? requiredZoom : 1.0;
}

/** 
 * Synchronously clamp entities to the world bounds.
 * Called by the simulation tick if flags.boundsChanged is true.
 */
export function clampEntitiesToWorld(world: WorldState): void {
  const w = world.worldWidth
  const h = world.worldHeight

  // If map shrinks and we are holding something outside, drop it
  if (world.draggedEntityId) {
    const draggedC = world.creatures.find(c => c.id === world.draggedEntityId);
    if (draggedC && (draggedC.x < 0 || draggedC.x > w || draggedC.y < 0 || draggedC.y > h)) {
      world.draggedEntityId = null;
    }
  }

  // Clamp creatures horizontally and vertically
  for (const c of world.creatures) {
    const radius = (BASE_RENDER_SIZE * c.renderScale * (c.currentScale || 1.0)) / 2
    
    // If creature is out of bounds, scatter it slightly inward to avoid physics explosions
    if (c.x < radius) c.x = radius + random() * 20;
    else if (c.x > w - radius) c.x = (w - radius) - random() * 20;
    
    if (c.y < radius) c.y = radius + random() * 20;
    else if (c.y > h - radius) c.y = (h - radius) - random() * 20;
  }

  // Clamp plants horizontally and vertically
  for (const p of world.plants) {
    const radius = 50 // Increased to 50 so large creatures can reach them!
    if (p.x < radius) p.x = radius + random() * 20;
    else if (p.x > w - radius) p.x = (w - radius) - random() * 20;
    
    if (p.y < radius) p.y = radius + random() * 20;
    else if (p.y > h - radius) p.y = (h - radius) - random() * 20;
  }
}

export const TERRAIN_CELL_SIZE = 100;

export function initializeTerrain(world: WorldState): void {
  const gridW = Math.ceil(world.worldWidth / TERRAIN_CELL_SIZE);
  const gridH = Math.ceil(world.worldHeight / TERRAIN_CELL_SIZE);
  const totalCells = gridW * gridH;
  
  const oldTerrain = world.scratchpad.terrain;
  const oldW = world.scratchpad.terrainWidth;
  const oldH = world.scratchpad.terrainHeight;

  // If missing entirely or sizes don't match exactly, we must create a new buffer
  if (!oldTerrain || oldTerrain.length !== totalCells || oldW !== gridW || oldH !== gridH) {
    const newTerrain = new Uint8Array(totalCells);
    newTerrain.fill(1); // Default to Dirt
    
    // Copy over old terrain if it exists (for resizing, preserving top-left layout)
    if (oldTerrain && oldW && oldH) {
      const minW = Math.min(oldW, gridW);
      const minH = Math.min(oldH, gridH);
      for (let y = 0; y < minH; y++) {
        for (let x = 0; x < minW; x++) {
          newTerrain[y * gridW + x] = oldTerrain[y * oldW + x];
        }
      }
    }
    
    world.scratchpad.terrain = newTerrain;
    world.scratchpad.terrainWidth = gridW;
    world.scratchpad.terrainHeight = gridH;
  }
}
