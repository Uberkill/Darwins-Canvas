import type { WorldState } from '../types'
import { moveCrawler, moveHopper, movePacer } from './movement'
import { runCollision } from './collision'
import { checkReproduction } from './reproduction'
import { tickPlantSpawner } from './spawner'
import { NavigationSystem } from './systems/NavigationSystem'
import { LifeSystem } from './systems/LifeSystem'
import { clampEntitiesToWorld } from './worldRef'
import { spawnCreature, spawnPlant, killCreature, flushDeadEntities } from './entityManager'
import { buildCreature } from './creatureFactory'
import { audio } from './audioEngine'
import {
  EXHAUSTION_SPEED_PENALTY,
  LUNGE_SPEED_MULTIPLIER,
  DAY_NIGHT_CYCLE_DURATION, NIGHT_SIGHT_PENALTY,
  WEATHER_CYCLE_DURATION, RAIN_PLANT_SPAWN_MULTIPLIER, DROUGHT_PLANT_SPAWN_MULTIPLIER,
  BASE_RENDER_SIZE
} from '../constants'

/**
 * simulate.ts — the simulation orchestrator.
 */
export function simulate(world: WorldState, dt: number): void {
  // ─── 0. Macro Clock ───
  world.timeOfDay = (world.timeOfDay + dt / DAY_NIGHT_CYCLE_DURATION) % 1.0;
  audio.updateTimeOfDay(world.timeOfDay);
  
  const weatherPhase = (world.totalTime % (WEATHER_CYCLE_DURATION * 2)) / WEATHER_CYCLE_DURATION;
  if (weatherPhase < 1.0) {
    world.weather = 'CLEAR';
  } else if (weatherPhase < 1.5) {
    world.weather = 'RAIN';
  } else {
    world.weather = 'DROUGHT';
  }

  let globalSightPenalty = 1.0;
  if (world.timeOfDay > 0.6 && world.timeOfDay < 0.9) {
    globalSightPenalty = 1.0 - NIGHT_SIGHT_PENALTY;
  } else if (world.timeOfDay >= 0.5 && world.timeOfDay <= 0.6) {
    const t = (world.timeOfDay - 0.5) / 0.1;
    globalSightPenalty = 1.0 - (NIGHT_SIGHT_PENALTY * t);
  } else if (world.timeOfDay >= 0.9 && world.timeOfDay <= 1.0) {
    const t = (world.timeOfDay - 0.9) / 0.1;
    globalSightPenalty = (1.0 - NIGHT_SIGHT_PENALTY) + (NIGHT_SIGHT_PENALTY * t);
  }

  // ─── 0. Corrupt Save Sanitization (Infinite Evolution Bug) ───
  for (const c of world.creatures) {
    if (Number.isNaN(c.health) || !isFinite(c.health) || Number.isNaN(c.maxHealth) || !isFinite(c.maxHealth)) {
      c.health = 0; // Force immediate death
      c.maxHealth = 100; // Reset to safe value so math doesn't propagate NaN during the death frame
      c.damage = 0;
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

  // Immigration System (Re-seeding Extinct Populations)
  if (!world.scratchpad.immigrationTimer) {
    world.scratchpad.immigrationTimer = 0;
  }
  world.scratchpad.immigrationTimer += dt;
  if (world.scratchpad.immigrationTimer > 120) { // Check every 120 seconds
    world.scratchpad.immigrationTimer = 0;
    
    let herbivores = 0, carnivores = 0, omnivores = 0;
    for (const c of world.creatures) {
       if (c.health > 0) {
         if (c.diet === 'HERBIVORE') herbivores++;
         else if (c.diet === 'CARNIVORE') carnivores++;
         else if (c.diet === 'OMNIVORE') omnivores++;
       }
    }

    const spawnMigrant = (diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE') => {
      // 5% chance to migrate if extinct
      if (Math.random() < 0.05) {
        const side = Math.random() < 0.5 ? 0 : world.worldWidth;
        const y = Math.random() * (world.worldHeight - 200) + 100;
        const migrantColor = diet === 'HERBIVORE' ? 'green' : diet === 'CARNIVORE' ? 'red' : 'purple';
        const migrantSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${migrantColor}"/></svg>`;
        const migrant = buildCreature({
           name: 'Migrant ' + diet.charAt(0) + diet.slice(1).toLowerCase(),
           diet,
           size: 'MEDIUM',
           movement: 'CRAWLER',
           drawingData: migrantSVG,
           decals: []
        }, world.worldWidth, world.worldHeight);
        migrant.x = side;
        migrant.y = y;
        babies.push(migrant);
      }
    };

    if (herbivores === 0) spawnMigrant('HERBIVORE');
    if (carnivores === 0) spawnMigrant('CARNIVORE');
    if (omnivores === 0) spawnMigrant('OMNIVORE');
  }

  // ─── 7. Flush dead entities ──
  // Process any creatures that starved this frame
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i];
    if (c.health <= 0 && !deletedCreatureIds.has(c.id)) {
      killCreature(world, c.id);
      spawnPlant(world, {
        id: crypto.randomUUID(),
        type: 'MEAT',
        x: c.x,
        y: c.y,
        growthStage: 1.0,
        wobblePhase: Math.random() * Math.PI * 2
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

  // ─── 8. Hit Detection ──────────────────────────────────────────────────────────
  world.hoveredEntityId = null
  let highestY = -Infinity
  for (let i = world.creatures.length - 1; i >= 0; i--) {
    const entity = world.creatures[i]
    // Use currentScale so babies don't have adult hitboxes
    const radius = (BASE_RENDER_SIZE * entity.renderScale * (entity.currentScale || 1.0)) / 2
    
    // Apple HIG / Material Design dictates minimum tap target of ~48px
    // We scale the padding by inverse zoom, and ensure the final physical radius on-screen is easily tappable
    let hitRadius = radius + (25 / world.camera.zoom)
    hitRadius = Math.max(48 / world.camera.zoom, hitRadius)
    
    // Offset the Y by radius so we hit the chest, not the feet.
    const visualCenterY = (entity.y - entity.z) - radius;
    const distSq = (entity.x - world.mouseX) ** 2 + (visualCenterY - world.mouseY) ** 2
    if (distSq < hitRadius ** 2) {
      if (entity.y > highestY) {
        highestY = entity.y
        world.hoveredEntityId = entity.id
      }
    }
  }
  
  // ─── SAFE LIFECYCLE DELETIONS ────────────────────────────────────────────────────────
  if (world.activeLure) {
    world.activeLure.timer -= dt
    if (world.activeLure.timer <= 0) {
      world.activeLure = null
    }
  }

  // ─── ECOSYSTEM ANALYTICS TRACKER (1Hz) ───
  world.historyTimer += dt
  if (world.historyTimer >= 1.0) {
    world.historyTimer = 0

    let carnivore = 0
    let omnivore = 0
    let herbivore = 0
    let maxGeneration = 1

    for (let i = 0; i < world.creatures.length; i++) {
      const c = world.creatures[i]
      if (c.diet === 'CARNIVORE') carnivore++
      else if (c.diet === 'OMNIVORE') omnivore++
      else if (c.diet === 'HERBIVORE') herbivore++
      
      if (c.generation > maxGeneration) {
        maxGeneration = c.generation
      }
    }

    let plant = 0
    let meat = 0
    for (let i = 0; i < world.plants.length; i++) {
      if (world.plants[i].type === 'MEAT') meat++
      else plant++
    }

    world.analytics.history.push({
      time: world.totalTime,
      carnivore, omnivore, herbivore, plant, meat,
      birthsCarn: world.analytics.currentSecondAccumulator.birthsCarn,
      birthsOmni: world.analytics.currentSecondAccumulator.birthsOmni,
      birthsHerb: world.analytics.currentSecondAccumulator.birthsHerb,
      starvationCarn: world.analytics.currentSecondAccumulator.starvationCarn,
      starvationOmni: world.analytics.currentSecondAccumulator.starvationOmni,
      starvationHerb: world.analytics.currentSecondAccumulator.starvationHerb,
      huntedCarn: world.analytics.currentSecondAccumulator.huntedCarn,
      huntedOmni: world.analytics.currentSecondAccumulator.huntedOmni,
      huntedHerb: world.analytics.currentSecondAccumulator.huntedHerb,
      damageCarn: world.analytics.currentSecondAccumulator.damageCarn,
      damageOmni: world.analytics.currentSecondAccumulator.damageOmni,
      damageHerb: world.analytics.currentSecondAccumulator.damageHerb,
      caloriesCarn: world.analytics.currentSecondAccumulator.caloriesCarn,
      caloriesOmni: world.analytics.currentSecondAccumulator.caloriesOmni,
      caloriesHerb: world.analytics.currentSecondAccumulator.caloriesHerb,
      maxGeneration
    })
    
    // Zero out the interval accumulators
    const accum = world.analytics.currentSecondAccumulator;
    accum.birthsCarn = 0; accum.birthsOmni = 0; accum.birthsHerb = 0;
    accum.starvationCarn = 0; accum.starvationOmni = 0; accum.starvationHerb = 0;
    accum.huntedCarn = 0; accum.huntedOmni = 0; accum.huntedHerb = 0;
    accum.damageCarn = 0; accum.damageOmni = 0; accum.damageHerb = 0;
    accum.caloriesCarn = 0; accum.caloriesOmni = 0; accum.caloriesHerb = 0;
  }
}
