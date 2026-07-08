import type { WorldState } from '../types'
import { getWorldWidth, getWorldHeight, BASE_RENDER_SIZE } from '../constants'

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
    mouseX:              -1000,
    mouseY:              -1000,
    hoveredEntityId:     null,
    activeLure:          null,
    flags:               { boundsChanged: false },
    timeOfDay:           0.1,
    weather:             'CLEAR',
    camera: {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 300,
      zoom: 1.0,
    },
    scratchpad: {
      deletedCreatureIds: new Set(),
      deletedPlantIds: new Set(),
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

/** Call this when the viewport is resized (orientation change, window resize). */
export function updateWorldDimensions(): void {
  worldRef.current.worldWidth  = getWorldWidth()
  worldRef.current.worldHeight = getWorldHeight()
  worldRef.current.flags.boundsChanged = true
}

/** 
 * Synchronously clamp entities to the world bounds.
 * Called by the simulation tick if flags.boundsChanged is true.
 */
export function clampEntitiesToWorld(world: WorldState): void {
  const w = world.worldWidth
  const h = world.worldHeight

  // Clamp creatures horizontally and vertically
  for (const c of world.creatures) {
    const radius = (BASE_RENDER_SIZE * c.renderScale * (c.currentScale || 1.0)) / 2
    c.x = Math.max(radius, Math.min(w - radius, c.x))
    c.y = Math.max(radius, Math.min(h - radius, c.y))
  }

  // Clamp plants horizontally and vertically
  for (const p of world.plants) {
    const radius = 50 // Increased to 50 so large creatures can reach them!
    p.x = Math.max(radius, Math.min(w - radius, p.x))
    p.y = Math.max(radius, Math.min(h - radius, p.y))
  }
}
