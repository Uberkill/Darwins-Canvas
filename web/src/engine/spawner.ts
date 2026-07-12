import { random } from './random';
import type { Plant, WorldState, Creature } from '../types'
import { getPlantCap, getPlantSpawnRate, PLANT_WOBBLE_SPEED, PLANT_GROWTH_RATE } from '../constants'
import { spawnPlant } from './entityManager'
import { TERRAIN_CELL_SIZE } from './worldRef'

/**
 * spawner.ts — plant spawning and growth logic.
 *
 * Plants spawn automatically at a fixed rate as long as the world
 * is below the cap. They grow from seedlings to full size, and
 * wobble organically each frame.
 */

const scratchNearbyPlants: Plant[] = [];
const scratchNearbyCreatures: Creature[] = [];

export function tickPlantSpawner(world: WorldState, dt: number): void {
  // ─── Tick wobble and growth for existing plants ───────────────────────────
  for (const plant of world.plants) {
    plant.wobblePhase += PLANT_WOBBLE_SPEED * dt
    plant.growthStage  = Math.min(1, plant.growthStage + PLANT_GROWTH_RATE * dt)
  }

  // ─── Spawn timer ──────────────────────────────────────────────────────────
  world.plantSpawnTimer -= dt
  if (world.plantSpawnTimer > 0) return
  if (world.plants.length >= getPlantCap(world.worldWidth, world.worldHeight)) {
    world.plantSpawnTimer = getPlantSpawnRate(world.worldWidth, world.worldHeight)
    return
  }

  // ─── Spawn a new plant ────────────────────────────────────────────────────
  const plant = createPlant(world)
  if (plant) {
    spawnPlant(world, plant)
  }
  world.plantSpawnTimer = getPlantSpawnRate(world.worldWidth, world.worldHeight)
}

function createPlant(world: WorldState): Plant | null {
  const margin = 50 // Increased so large creatures don't get stuck trying to reach it
  const radius = 15 // Approx plant radius for overlap checks

  // Try 10 times to find a clear spawn point
  for (let attempt = 0; attempt < 10; attempt++) {
    const x = margin + random() * (world.worldWidth - margin * 2)
    const y = margin + random() * (world.worldHeight - margin * 2)

    let blocked = false
    
    // Evaluate Terrain Fertility
    const tw = world.scratchpad.terrainWidth;
    const th = world.scratchpad.terrainHeight;
    const terrain = world.scratchpad.terrain;
    if (terrain && tw && th) {
      const px = Math.floor(x / TERRAIN_CELL_SIZE);
      const py = Math.floor(y / TERRAIN_CELL_SIZE);
      if (px >= 0 && px < tw && py >= 0 && py < th) {
        const val = terrain[py * tw + px];
        let spawnChance = 0.5; // Default Dirt
        if (val === 0) spawnChance = 0.0; // Water (no plants)
        else if (val === 2) spawnChance = 1.0; // Grass (very fertile)
        else if (val === 3) spawnChance = 0.1; // Rock (barren)
        
        if (random() > spawnChance) {
          blocked = true;
        }
      }
    }
    
    world.scratchpad.spatialGrid.getNearbyPlants(x, y, radius + 15, scratchNearbyPlants);
    if (scratchNearbyPlants.length > 0) blocked = true;

    if (!blocked) {
      world.scratchpad.spatialGrid.getNearbyCreatures(x, y, radius + 40, scratchNearbyCreatures);
      if (scratchNearbyCreatures.length > 0) blocked = true;
    }

    if (!blocked) {
      return {
        id:          crypto.randomUUID(),
        type:        'PLANT',
        x,
        y,
        growthStage: 0,
        wobblePhase: random() * Math.PI * 2,
      }
    }
  }

  // Could not find a clear spot
  return null
}
