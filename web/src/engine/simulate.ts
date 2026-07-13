import { random } from './random';
import type { WorldState } from '../types'
import { moveCrawler, moveHopper, movePacer } from './movement'
import { runCollision } from './collision'
import { checkReproduction } from './reproduction'
import { tickPlantSpawner } from './spawner'
import { EnvironmentSystem } from './systems/EnvironmentSystem'
import { ImmigrationSystem } from './systems/ImmigrationSystem'
import { NavigationSystem } from './systems/NavigationSystem'
import { LifeSystem } from './systems/LifeSystem'
import { clampEntitiesToWorld, TERRAIN_CELL_SIZE } from './worldRef'
import { spawnCreature, spawnPlant, killCreature, flushDeadEntities, nextPlantId } from './entityManager'
import { audio } from './audioEngine'
import { SpatialGrid } from './SpatialGrid'
import {
  EXHAUSTION_SPEED_PENALTY,
  LUNGE_SPEED_MULTIPLIER,
  RAIN_PLANT_SPAWN_MULTIPLIER, DROUGHT_PLANT_SPAWN_MULTIPLIER
} from '../constants'

/**
 * simulate.ts — the simulation orchestrator.
 */
export function simulate(world: WorldState, dt: number): void {
  // ─── 0. Macro Clock ───
  const globalSightPenalty = EnvironmentSystem.update(world, dt);
  audio.updateTimeOfDay(world.timeOfDay);

  // ─── 0. Corrupt Save Sanitization (Infinite Evolution Bug) ───
  for (const c of world.creatures) {
    if (Number.isNaN(c.health) || !isFinite(c.health) || Number.isNaN(c.maxHealth) || !isFinite(c.maxHealth)) {
      c.health = 0; // Force immediate death
      c.maxHealth = 100; // Reset to safe value so math doesn't propagate NaN during the death frame
      c.damage = 0;
    }
  }

  // ─── 0. Build Spatial Grid ──────────────────────────────────────────────────
  if (!world.scratchpad.spatialGrid) {
    world.scratchpad.spatialGrid = new SpatialGrid(world.worldWidth, world.worldHeight, 150);
  } else {
    world.scratchpad.spatialGrid.resize(world.worldWidth, world.worldHeight);
  }
  world.scratchpad.spatialGrid.clear();
  
  for (const c of world.creatures) {
    if (c.health > 0 && !world.scratchpad.deletedCreatureIds.has(c.id)) {
      // FYI: SpatialGrid's getCellIndex uses Math.max/min clamping under the hood.
      // If physics launches a creature to x=-5000, it safely pins it to the edge cell
      // instead of throwing an Array Out-of-Bounds crash.
      world.scratchpad.spatialGrid.insertCreature(c);
    }
  }
  for (const p of world.plants) {
    if (!world.scratchpad.deletedPlantIds.has(p.id)) {
      world.scratchpad.spatialGrid.insertPlant(p);
    }
  }

  // ─── Visual Effects ───
  if (world.visualEffects) {
    for (let i = world.visualEffects.length - 1; i >= 0; i--) {
      world.visualEffects[i].timer -= dt;
      if (world.visualEffects[i].timer <= 0) {
        world.visualEffects.splice(i, 1);
      }
    }
  }

  // ─── 0. Bounds Check ──────────────────────────────────────────────────────
  if (world.flags.boundsChanged) {
    clampEntitiesToWorld(world)
    world.flags.boundsChanged = false
  }

  // ─── 1. Sensory & Boids AI ────────────────────────────────────────────────
  NavigationSystem.update(world, dt, globalSightPenalty);

  // ─── 2. Age + Stamina + Hunger drain ───
  LifeSystem.update(world, dt, globalSightPenalty);

  // ─── 3. Movement ──────────────────────────────────────────────────────────
  // Hoist terrain constants outside the loop — they are frame-constants.
  const terrainTw = world.scratchpad.terrainWidth;
  const terrainTh = world.scratchpad.terrainHeight;
  const terrainData = world.scratchpad.terrain;

  for (const creature of world.creatures) {
    if (creature.behavior === 'SLEEPING' as any) continue;
    if (creature.id === world.draggedEntityId) continue;
    let speedMult = 1.0;
    if (creature.stamina <= 0) {
      speedMult = EXHAUSTION_SPEED_PENALTY;
      creature.lungeTimer = 0; // Cancel active lunge if exhausted
    } else if (creature.lungeTimer > 0) {
      speedMult = LUNGE_SPEED_MULTIPLIER;
    }
    
    // Apply terrain speed penalties
    if (terrainData && terrainTw && terrainTh) {
      const px = Math.floor(creature.x / TERRAIN_CELL_SIZE);
      const py = Math.floor(creature.y / TERRAIN_CELL_SIZE);
      if (px >= 0 && px < terrainTw && py >= 0 && py < terrainTh) {
        const val = terrainData[py * terrainTw + px];
        if (val === 0) { // Water
           if (creature.movement === 'CRAWLER' || creature.movement === 'PACER') {
              speedMult *= 0.5; // 50% slow in water
           }
        } else if (val === 3) { // Rock
           speedMult *= 0.7; // 30% slow on rocks
        }
      }
    }

    const effectiveDt = dt * speedMult;

    switch (creature.movement) {
      case 'CRAWLER': moveCrawler(creature, effectiveDt, world.worldWidth, world.worldHeight); break
      case 'HOPPER':  moveHopper(creature,  effectiveDt, world.worldWidth, world.worldHeight); break
      case 'PACER':   movePacer(creature,   effectiveDt, world.worldWidth, world.worldHeight); break
    }
  }

  // ─── 4. Collision & Feeding ───
  runCollision(world, dt)
  const deletedCreatureIds = world.scratchpad.deletedCreatureIds;

  // ─── 5. Reproduction (skip creatures already flagged for deletion) ───────────
  const babies = checkReproduction(world, dt, deletedCreatureIds)

  // ─── 6. Migration (if extinct) ───
  let weatherMultiplier = 1.0;
  if (world.weather === 'RAIN') weatherMultiplier = RAIN_PLANT_SPAWN_MULTIPLIER;
  if (world.weather === 'DROUGHT') weatherMultiplier = DROUGHT_PLANT_SPAWN_MULTIPLIER;
  tickPlantSpawner(world, dt * weatherMultiplier);

  ImmigrationSystem.update(world, dt);

  // ─── 7. Flush dead entities ──
  // Process any creatures that starved this frame
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i];
    if (c.health <= 0 && !deletedCreatureIds.has(c.id)) {
      killCreature(world, c.id);
      spawnPlant(world, {
        id: nextPlantId(),
        type: 'MEAT',
        x: c.x,
        y: c.y,
        growthStage: 1.0,
        wobblePhase: random() * Math.PI * 2
      });
    }
  }
  
  if (babies.length > 0) {
    for (let i = 0; i < babies.length; i++) {
      spawnCreature(world, babies[i]);
      if (babies[i].diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.birthsCarn++;
      else if (babies[i].diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.birthsOmni++;
      else if (babies[i].diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.birthsHerb++;
    }
  }

  world.totalTime += dt;
  
  // Actually remove them from the arrays safely
  flushDeadEntities(world);

  // ─── SAFE LIFECYCLE DELETIONS ────────────────────────────────────────────────────────
  if (world.activeLure) {
    world.activeLure.timer -= dt
    if (world.activeLure.timer <= 0) {
      world.activeLure = null
    }
  }
}
