import type { Plant, WorldState } from '../types'
import { PLANT_CAP, PLANT_SPAWN_RATE, PLANT_WOBBLE_SPEED, PLANT_GROWTH_RATE } from '../constants'
import { buildCreature } from './simulate'

/**
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
    world.plants.push(plant)
  }
  world.plantSpawnTimer = PLANT_SPAWN_RATE
}

export function createPlant(world: WorldState): Plant | null {
  const margin = 20
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

export function tickHerbivoreSpawner(world: WorldState, dt: number): void {
  // Check if we need to spawn
  let herbivoreCount = 0
  for (const c of world.creatures) {
    if (c.diet === 'HERBIVORE') herbivoreCount++
  }

  if (herbivoreCount > 0) {
    world.herbivoreSpawnTimer = 10 // Reset if herbivores exist
    return
  }

  world.herbivoreSpawnTimer -= dt
  if (world.herbivoreSpawnTimer > 0) return

  // Time to spawn! Generate generic wild herbivore
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#2ecc71" /><circle cx="30" cy="40" r="10" fill="white" /><circle cx="70" cy="40" r="10" fill="white" /><circle cx="30" cy="40" r="4" fill="black" /><circle cx="70" cy="40" r="4" fill="black" /><path d="M 30 70 Q 50 85 70 70" stroke="black" stroke-width="5" fill="transparent" stroke-linecap="round"/></svg>`
  const base64 = btoa(svg)
  const drawingData = `data:image/svg+xml;base64,${base64}`

  const margin = 50
  let spawnX = margin
  let spawnY = margin
  
  // Safe-spawn generation: Find a spot >150px away from all carnivores
  const SAFE_DIST = 150
  const carnivores = world.creatures.filter(c => c.diet === 'CARNIVORE')
  
  let bestX = spawnX
  let bestY = spawnY
  let maxMinDist = -1

  for (let attempt = 0; attempt < 10; attempt++) {
    const x = margin + Math.random() * (world.worldWidth - margin * 2)
    const y = margin + Math.random() * (world.worldHeight - margin * 2)
    
    let minDist = Infinity
    for (const carn of carnivores) {
      const dSq = (carn.x - x)**2 + (carn.y - y)**2
      if (dSq < minDist) minDist = dSq
    }

    if (carnivores.length === 0 || Math.sqrt(minDist) >= SAFE_DIST) {
      spawnX = x
      spawnY = y
      break // Safe spot found
    }

    if (minDist > maxMinDist) {
      maxMinDist = minDist
      bestX = x
      bestY = y
    }

    // If we reach attempt 9 and haven't found a completely safe spot, use the best one
    if (attempt === 9) {
      spawnX = bestX
      spawnY = bestY
    }
  }

  const baby = buildCreature({
    name: 'Wild Blob',
    drawingData,
    diet: 'HERBIVORE',
    size: 'MEDIUM',
    movement: 'HOPPER'
  }, world.worldWidth, world.worldHeight)

  baby.x = spawnX
  baby.y = spawnY
  
  world.creatures.push(baby)
  world.herbivoreSpawnTimer = 10
}
