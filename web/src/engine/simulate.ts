import type { Creature, PendingCreature, WorldState } from '../types'
import { moveCrawler, moveHopper, movePacer } from './movement'
import { evaluateThoughts } from './ai/Thoughts'
import { calculateBoids } from './ai/Boids'
import { runCollision } from './collision'
import { checkReproduction } from './reproduction'
import { tickPlantSpawner, tickHerbivoreSpawner } from './spawner'
import { clampEntitiesToWorld } from './worldRef'
import { releaseImage } from '../renderer/imageCache'
import {
  BASE_SPEED, STARTING_HUNGER, SIZE_STATS,
  PACER_MOVE_DURATION, BASE_RENDER_SIZE,
  HERBIVORE_BASE_HUNGER_DRAIN, CARNIVORE_BASE_HUNGER_DRAIN, OMNIVORE_BASE_HUNGER_DRAIN,
  FLEEING_HUNGER_MULTIPLIER, HUNTING_HUNGER_MULTIPLIER,
  SIGHT_RADIUS, MAX_STEERING_FORCE,
  BASE_HEALTH, PASSIVE_HEAL_RATE, STARVATION_DAMAGE,
  HERBIVORE_BASE_DAMAGE, CARNIVORE_BASE_DAMAGE, OMNIVORE_BASE_DAMAGE,
  MAX_STAMINA, STAMINA_DRAIN_RATE, STAMINA_REGEN_RATE, EXHAUSTION_SPEED_PENALTY,
  LUNGE_DURATION, LUNGE_COOLDOWN, LUNGE_SPEED_MULTIPLIER,
  DAY_NIGHT_CYCLE_DURATION, NIGHT_SIGHT_PENALTY,
  WEATHER_CYCLE_DURATION, RAIN_PLANT_SPAWN_MULTIPLIER, DROUGHT_PLANT_SPAWN_MULTIPLIER
} from '../constants'

const ADULT_AGE = 30; // 30 seconds to reach full size

/**
 * simulate.ts — the simulation orchestrator.
 */
export function simulate(world: WorldState, dt: number): void {
  // ─── 0. Macro Clock ───
  world.timeOfDay = (world.timeOfDay + dt / DAY_NIGHT_CYCLE_DURATION) % 1.0;
  
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

  // ─── 0. Bounds Check ──────────────────────────────────────────────────────
  if (world.flags.boundsChanged) {
    clampEntitiesToWorld(world)
    world.flags.boundsChanged = false
  }

  // ─── 1. Sensory & Boids AI ────────────────────────────────────────────────
  for (let i = 0; i < world.creatures.length; i++) {
    const c = world.creatures[i]
    if (c.id === world.draggedEntityId) {
      c.direction.vx = 0
      c.direction.vy = 0
      continue
    }
    c.behavior = 'WANDERING'
    c.targetId = null

    // Carnivores get a 40% boost at night!
    const sightMult = c.diet === 'CARNIVORE' && globalSightPenalty < 0.9 ? 1.4 : globalSightPenalty;
    c.sightRadius = c.baseStats.sightRadius * sightMult;

    const perception = evaluateThoughts(c, world, world.timeOfDay);
    const boids = calculateBoids(c, world);

    let forceX = 0;
    let forceY = 0;
    let remainingBudget = MAX_STEERING_FORCE;

    const accumulateForce = (fX: number, fY: number) => {
      if (remainingBudget <= 0) return;
      const mag = Math.sqrt(fX*fX + fY*fY) || 1;
      if (mag <= remainingBudget) {
        forceX += fX;
        forceY += fY;
        remainingBudget -= mag;
      } else {
        forceX += (fX / mag) * remainingBudget;
        forceY += (fY / mag) * remainingBudget;
        remainingBudget = 0;
      }
    };

    // 1. Separation (Highest Priority: don't crash into others)
    if (boids.boidCount > 0) {
      const sepMag = Math.sqrt(boids.sepX*boids.sepX + boids.sepY*boids.sepY) || 1;
      accumulateForce((boids.sepX / sepMag) * MAX_STEERING_FORCE * 1.5, (boids.sepY / sepMag) * MAX_STEERING_FORCE * 1.5);
    }

    // 2. Fleeing / Foraging / Lure
    if (perception.targetId && perception.targetType) {
      c.targetId = perception.targetId;
      if (perception.targetType === 'FLEE') c.behavior = 'FLEEING';
      else if (perception.targetType === 'LURE') c.behavior = 'WANDERING';
      else c.behavior = 'FORAGING';

      let dX = c.x - perception.targetX;
      let dY = c.y - perception.targetY;
      if (dX === 0 && dY === 0) { dX = 0.1; dY = 0.1; }
      const dist = Math.sqrt(dX*dX + dY*dY) || 1;

      if (perception.targetType === 'FLEE') {
        const desiredX = dX / dist;
        const desiredY = dY / dist;
        const urgency = 1 - Math.min(1, dist / c.sightRadius);
        const applyForce = MAX_STEERING_FORCE * (0.5 + 0.5 * urgency) * 2.0;
        accumulateForce(desiredX * applyForce, desiredY * applyForce);
      } else {
        // FORAGE or LURE (seek)
        const desiredX = -dX / dist;
        const desiredY = -dY / dist;
        let force = MAX_STEERING_FORCE;
        if (perception.targetType === 'LURE') force = MAX_STEERING_FORCE * 2; // Strong lure pull
        accumulateForce(desiredX * force, desiredY * force);
      }
    }

    // 3. Herding: Alignment & Cohesion (Only if not fleeing!)
    if (c.mood !== 'SCARED' && boids.boidCount > 0) {
      accumulateForce(boids.alignX * MAX_STEERING_FORCE * 0.8, boids.alignY * MAX_STEERING_FORCE * 0.8);
      accumulateForce(boids.cohX * MAX_STEERING_FORCE * 0.5, boids.cohY * MAX_STEERING_FORCE * 0.5);
    }

    // Apply accumulated steering forces
    if (forceX !== 0 || forceY !== 0) {
      c.direction.vx += forceX * dt
      c.direction.vy += forceY * dt
      const mag = Math.sqrt(c.direction.vx*c.direction.vx + c.direction.vy*c.direction.vy)
      if (mag === 0) {
        const angle = Math.random() * Math.PI * 2
        c.direction.vx = Math.cos(angle)
        c.direction.vy = Math.sin(angle)
      } else {
        c.direction.vx /= mag
        c.direction.vy /= mag
      }
    }

  }

  // ─── 2. Age + Stamina + Hunger drain ───
  for (const creature of world.creatures) {
    creature.age += dt
    
    // Growth
    if (creature.age < ADULT_AGE) {
      // Linearly scale from 0.5 to 1.5
      creature.currentScale = 0.5 + (creature.age / ADULT_AGE) * 1.0;
    } else if (creature.age > creature.maxAge * 0.8) {
      // Shrink in old age (from 1.5 down to 1.2)
      const oldAgeProgress = (creature.age - creature.maxAge * 0.8) / (creature.maxAge * 0.2);
      creature.currentScale = 1.5 - (oldAgeProgress * 0.3);
    } else {
      creature.currentScale = 1.5;
    }

    // Death by old age
    if (creature.age >= creature.maxAge) {
      creature.health = 0;
    }

    // Sleep behavior
    const isNight = globalSightPenalty < 0.9;
    if (isNight && creature.diet !== 'CARNIVORE' && creature.behavior !== 'FLEEING' && creature.health > 50) {
      creature.behavior = 'SLEEPING' as any;
    } else if (creature.behavior === 'SLEEPING' as any) {
      creature.behavior = 'WANDERING';
    }

    if (creature.behavior === 'FLEEING') {
      creature.stamina = Math.max(0, creature.stamina - STAMINA_DRAIN_RATE * dt);
    } else {
      creature.stamina = Math.min(creature.maxStamina, creature.stamina + STAMINA_REGEN_RATE * dt);
    }

    if (creature.lungeCooldownTimer > 0) {
      creature.lungeCooldownTimer -= dt;
    }
    if (creature.lungeTimer > 0) {
      creature.lungeTimer -= dt;
    }

    if (creature.diet === 'CARNIVORE' && creature.behavior === 'FORAGING') {
      // Trigger Lunge if they are chasing meat and not on cooldown
      if (creature.lungeCooldownTimer <= 0 && creature.lungeTimer <= 0) {
        creature.lungeTimer = LUNGE_DURATION;
        creature.lungeCooldownTimer = LUNGE_DURATION + LUNGE_COOLDOWN;
      }
    }

    let drainMultiplier = 1.0
    if (creature.behavior === 'SLEEPING' as any) {
      drainMultiplier = 0.2;
      creature.state = 'IDLE';
    }
    if (creature.behavior === 'FLEEING') drainMultiplier = FLEEING_HUNGER_MULTIPLIER
    else if (creature.behavior === 'FORAGING' && creature.diet === 'CARNIVORE') drainMultiplier = HUNTING_HUNGER_MULTIPLIER

    creature.hunger -= creature.hungerDrainRate * drainMultiplier * dt

    // Health Regeneration or Starvation
    if (creature.hunger > 80) {
      creature.health = Math.min(creature.maxHealth, creature.health + PASSIVE_HEAL_RATE * dt)
    } else if (creature.hunger <= 0) {
      creature.health -= STARVATION_DAMAGE * dt
    }

    // Reset state to MOVING if it was EATING (eating is momentary)
    // Avoid overwriting FIGHTING state
    if (creature.state === 'EATING') {
      creature.state = 'MOVING'
    }
  }

  // ─── 3. Movement ──────────────────────────────────────────────────────────
  for (const creature of world.creatures) {
    if (creature.behavior === 'SLEEPING' as any) continue;
    if (creature.id === world.draggedEntityId) continue;
    let speedMult = 1.0;
    if (creature.stamina <= 0) speedMult = EXHAUSTION_SPEED_PENALTY;
    if (creature.lungeTimer > 0) speedMult = LUNGE_SPEED_MULTIPLIER;
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
  const deletedPlantIds = world.scratchpad.deletedPlantIds;

  // ─── 5. Reproduction (skip creatures already flagged for deletion) ───────────
  const babies = checkReproduction(world, dt, deletedCreatureIds)

  // ─── 6. Plant spawner + growth + Herbivore Spawner ────────────────────────
  let weatherMultiplier = 1.0;
  if (world.weather === 'RAIN') weatherMultiplier = RAIN_PLANT_SPAWN_MULTIPLIER;
  if (world.weather === 'DROUGHT') weatherMultiplier = DROUGHT_PLANT_SPAWN_MULTIPLIER;
  tickPlantSpawner(world, dt * weatherMultiplier);
  tickHerbivoreSpawner(world, dt)

  // ─── 7. Flush dead entities (Zero-GC Swap and Pop) ────────────────────────
  if (deletedCreatureIds.size > 0 || world.creatures.some(c => c.health <= 0)) {
    for (let i = world.creatures.length - 1; i >= 0; i--) {
      const c = world.creatures[i];
      if (c.health <= 0 || deletedCreatureIds.has(c.id)) {
        releaseImage(c.id);
        // Swap with the last element and pop
        world.creatures[i] = world.creatures[world.creatures.length - 1];
        world.creatures.pop();
      }
    }
  }
  
  if (babies.length > 0) {
    for (let i = 0; i < babies.length; i++) {
      world.creatures.push(babies[i]);
    }
  }

  if (deletedPlantIds.size > 0) {
    for (let i = world.plants.length - 1; i >= 0; i--) {
      if (deletedPlantIds.has(world.plants[i].id)) {
        world.plants[i] = world.plants[world.plants.length - 1];
        world.plants.pop();
      }
    }
  }

  // Clear scratchpad for next frame
  deletedCreatureIds.clear();
  deletedPlantIds.clear();

  world.totalTime += dt

  // ─── 8. Hit Detection ─────────────────────────────────────────────────────
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
    
    const distSq = (entity.x - world.mouseX) ** 2 + ((entity.y - entity.z) - world.mouseY) ** 2
    if (distSq < hitRadius ** 2) {
      if (entity.y > highestY) {
        highestY = entity.y
        world.hoveredEntityId = entity.id
      }
    }
  }

  // ─── 9. Lure Timer ────────────────────────────────────────────────────────
  if (world.activeLure) {
    world.activeLure.timer -= dt
    if (world.activeLure.timer <= 0) {
      world.activeLure = null
    }
  }
}

// ─── buildCreature — factory ──────────────────────────────────────────────────
export function buildCreature(
  pending: PendingCreature,
  worldWidth: number,
  worldHeight: number,
  generation: number = 1
): Creature {
  const stats = SIZE_STATS[pending.size]
  const angle = Math.random() * Math.PI * 2

  let baseDrain = HERBIVORE_BASE_HUNGER_DRAIN
  let baseDamage = HERBIVORE_BASE_DAMAGE
  if (pending.diet === 'CARNIVORE') {
    baseDrain = CARNIVORE_BASE_HUNGER_DRAIN
    baseDamage = CARNIVORE_BASE_DAMAGE
  } else if (pending.diet === 'OMNIVORE') {
    baseDrain = OMNIVORE_BASE_HUNGER_DRAIN
    baseDamage = OMNIVORE_BASE_DAMAGE
  }

  const maxHealth = BASE_HEALTH * stats.healthMultiplier
  const speed = BASE_SPEED * stats.speedMultiplier
  const baseDrainRate = baseDrain * stats.hungerDrainMultiplier
  const initialBravery = Math.random()

  return {
    // Identity
    id:          crypto.randomUUID(),
    name:        pending.name || 'Unknown',
    drawingData: pending.drawingData,

    // Position
    x: 30 + Math.random() * (worldWidth - 60),
    y: 30 + Math.random() * (worldHeight - 60),
    z: 0,

    // Traits
    size:     pending.size,
    movement: pending.movement,
    diet:     pending.diet,

    // Cached stats
    speed:           speed,
    hungerDrainRate: baseDrainRate,
    renderScale:     stats.renderScale,
    maxHealth:       maxHealth,
    damage:          baseDamage * stats.damageMultiplier,
    sightRadius:     SIGHT_RADIUS,

    // Personality & Brain
    bravery:   initialBravery,
    kills:     0,
    mood:      'HAPPY',
    intent:    'Just born!',

    // Genetics
    hueShift: 0,
    baseDrainRate: baseDrainRate,
    baseStats: {
      speed: speed,
      sightRadius: SIGHT_RADIUS,
      maxHealth: maxHealth,
      maxStamina: MAX_STAMINA,
      renderScale: stats.renderScale,
      bravery: initialBravery,
    },

    // Live state
    health:    maxHealth,
    hunger:    STARTING_HUNGER,
    direction: { vx: Math.cos(angle), vy: Math.sin(angle) },
    state:     'IDLE',
    behavior:  'WANDERING',
    targetId:  null,
    age:       0,
    maxAge:    pending.diet === 'CARNIVORE' ? 420 : 300,
    generation,
    currentScale: 0.5,

    // Movement sub-state
    hopPhase:        Math.random() * Math.PI * 2,
    hopPauseTimer:   0,
    pacerMoveTimer:  PACER_MOVE_DURATION,
    pacerPauseTimer: 0,
    pacerPaused:     false,

    // Reproduction
    reproductionCooldown: 0,
    
    // Stamina & Combat
    stamina: MAX_STAMINA,
    maxStamina: MAX_STAMINA,
    lungeTimer: 0,
    lungeCooldownTimer: 0,
  }
}
