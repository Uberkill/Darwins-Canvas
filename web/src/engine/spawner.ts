import type { Plant, WorldState } from '../types'
import { PLANT_CAP, PLANT_SPAWN_RATE, PLANT_WOBBLE_SPEED, PLANT_GROWTH_RATE } from '../constants'
import { spawnPlant } from './entityManager'/**
 * spawner.ts — plant spawning and growth logic.
 *
 * Plants spawn automatically at a fixed rate as long as the world
 * is below the cap. They grow from seedlings to full size, and
 * wobble organically each frame.
 */

export function tickPlantSpawner(world: WorldState, dt: number): void {
  // ─── Tick wobble and growth for existing plants ───────────────────────────
  for (const plant of world.plants) {
    plant.wobblePhase += PLANT_WOBBLE_SPEED * dt
    plant.growthStage  = Math.min(1, plant.growthStage + PLANT_GROWTH_RATE * dt)
  }

  // ─── Spawn timer ──────────────────────────────────────────────────────────
  world.plantSpawnTimer -= dt
  if (world.plantSpawnTimer > 0) return
  if (world.plants.length >= PLANT_CAP) {
    world.plantSpawnTimer = PLANT_SPAWN_RATE
    return
  }

  // ─── Spawn a new plant ────────────────────────────────────────────────────
  const plant = createPlant(world)
  if (plant) {
    spawnPlant(world, plant)
  }
  world.plantSpawnTimer = PLANT_SPAWN_RATE
}

function createPlant(world: WorldState): Plant | null {
  const margin = 50 // Increased so large creatures don't get stuck trying to reach it
  const radius = 15 // Approx plant radius for overlap checks

  // Try 10 times to find a clear spawn point
  for (let attempt = 0; attempt < 10; attempt++) {
    const x = margin + Math.random() * (world.worldWidth - margin * 2)
    const y = margin + Math.random() * (world.worldHeight - margin * 2)

    let blocked = false
    
    // Check against plants
    for (const p of world.plants) {
      const distSq = (p.x - x)**2 + (p.y - y)**2
      if (distSq < (radius + 15)**2) {
        blocked = true; break;
      }
    }

    // Check against creatures (approx 40px radius)
    if (!blocked) {
      for (const c of world.creatures) {
        const distSq = (c.x - x)**2 + (c.y - y)**2
        if (distSq < (radius + 40)**2) {
          blocked = true; break;
        }
      }
    }

    if (!blocked) {
      return {
        id:          crypto.randomUUID(),
        type:        'PLANT',
        x,
        y,
        growthStage: 0,
        wobblePhase: Math.random() * Math.PI * 2,
      }
    }
  }

  // Could not find a clear spot
  return null
}
