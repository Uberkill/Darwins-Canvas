import type { Creature, Plant, WorldState } from '../types'
import { releaseImage } from '../renderer/imageCache'
import { TrackingManager } from '../features/tracking/trackingManager'

/**
 * Safely adds a creature to the world.
 */
export function spawnCreature(world: WorldState, creature: Creature): void {
  world.creatures.push(creature)
}

/**
 * Safely adds a plant to the world.
 */
export function spawnPlant(world: WorldState, plant: Plant): void {
  world.plants.push(plant)
}

/**
 * Flags a creature for deletion, deferring the actual array mutation to `flushDeadEntities`.
 */
export function killCreature(world: WorldState, id: string): void {
  world.scratchpad.deletedCreatureIds.add(id)
}

/**
 * Flags a plant for deletion, deferring the actual array mutation to `flushDeadEntities`.
 */
export function killPlant(world: WorldState, id: string): void {
  world.scratchpad.deletedPlantIds.add(id)
}

/**
 * Clears all creatures and plants from the world. Used when returning to the title screen.
 */
export function clearEntities(world: WorldState): void {
  for (const c of world.creatures) {
    releaseImage(c.id)
  }
  world.creatures = []
  world.plants = []
  world.scratchpad.deletedCreatureIds.clear()
  world.scratchpad.deletedPlantIds.clear()
  world.draggedEntityId = null
  world.hoveredEntityId = null
}

/**
 * Fully resets the world state to defaults. Used when returning to the title screen.
 */
export function resetWorld(world: WorldState): void {
  clearEntities(world)
  world.timeOfDay = 0.1
  world.activeLure = null
  world.camera = { x: 0, y: 0, zoom: 1.0 }
}

/**
 * Replaces the entire entity list (used during loading saves).
 */
export function setEntities(world: WorldState, creatures: Creature[], plants: Plant[]): void {
  clearEntities(world)
  world.creatures = creatures
  world.plants = plants
}

/**
 * Processes all deferred deletions.
 * This should be called exactly once at the very end of the simulation loop
 * to prevent mid-frame array mutation bugs (which causes skipping elements in loops).
 */
export function flushDeadEntities(world: WorldState): void {
  if (world.scratchpad.deletedCreatureIds.size > 0) {
    for (let i = world.creatures.length - 1; i >= 0; i--) {
      const c = world.creatures[i];
      if (world.scratchpad.deletedCreatureIds.has(c.id)) {
        // Tag & Track hook
        TrackingManager.checkDeath(c);
        
        releaseImage(c.id)
        world.creatures.splice(i, 1)
        if (world.draggedEntityId === c.id) world.draggedEntityId = null
        if (world.hoveredEntityId === c.id) world.hoveredEntityId = null
      }
    }
    world.scratchpad.deletedCreatureIds.clear()
  }

  if (world.scratchpad.deletedPlantIds.size > 0) {
    for (let i = world.plants.length - 1; i >= 0; i--) {
      if (world.scratchpad.deletedPlantIds.has(world.plants[i].id)) {
        world.plants.splice(i, 1)
      }
    }
    world.scratchpad.deletedPlantIds.clear()
  }
}
