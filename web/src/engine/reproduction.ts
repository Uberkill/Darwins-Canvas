import { random } from './random';
import type { Creature, WorldState } from '../types'
import {
  REPRO_SPAWN_OFFSET, STARTING_HUNGER,
  getGlobalPopulationCap, getCarnivorePopulationCap, getHerbivorePopulationCap, getOmnivorePopulationCap,
  HERBIVORE_REPRO_THRESHOLD, HERBIVORE_REPRO_COOLDOWN, HERBIVORE_REPRO_CHANCE,
  CARNIVORE_REPRO_THRESHOLD, CARNIVORE_REPRO_COOLDOWN, CARNIVORE_REPRO_CHANCE,
  OMNIVORE_REPRO_THRESHOLD, OMNIVORE_REPRO_COOLDOWN, OMNIVORE_REPRO_CHANCE,
} from '../constants'

/**
 * reproduction.ts — simple asexual reproduction for ecosystem longevity.
 */
export function checkReproduction(
  world: WorldState,
  dt: number,
  excludeIds: Set<string> = new Set(),
): Creature[] {
  if (world.creatures.length >= getGlobalPopulationCap(world.worldWidth, world.worldHeight)) return []

  const babies: Creature[] = []
  
  let currentCarnivores = 0
  let currentHerbivores = 0
  let currentOmnivores = 0
  for (const c of world.creatures) {
    if (c.diet === 'CARNIVORE') currentCarnivores++
    else if (c.diet === 'HERBIVORE') currentHerbivores++
    else if (c.diet === 'OMNIVORE') currentOmnivores++
  }

  for (const creature of world.creatures) {
    if (excludeIds.has(creature.id)) continue

    if (creature.reproductionCooldown > 0) {
      creature.reproductionCooldown -= dt
      continue
    }

    const isCarnivore = creature.diet === 'CARNIVORE'
    const isHerbivore = creature.diet === 'HERBIVORE'
    const isOmnivore = creature.diet === 'OMNIVORE'
    
    let threshold = HERBIVORE_REPRO_THRESHOLD
    let cooldown  = HERBIVORE_REPRO_COOLDOWN
    let reproChance = HERBIVORE_REPRO_CHANCE
    
    if (isCarnivore) {
      threshold = CARNIVORE_REPRO_THRESHOLD
      cooldown = CARNIVORE_REPRO_COOLDOWN
      reproChance = CARNIVORE_REPRO_CHANCE
    } else if (isOmnivore) {
      threshold = OMNIVORE_REPRO_THRESHOLD
      cooldown = OMNIVORE_REPRO_COOLDOWN
      reproChance = OMNIVORE_REPRO_CHANCE
    }

    if (creature.hunger < threshold) continue

    // Global cap check
    if (world.creatures.length + babies.length >= getGlobalPopulationCap(world.worldWidth, world.worldHeight)) break
    
    // Diet cap check
    if (isCarnivore && currentCarnivores >= getCarnivorePopulationCap(world.worldWidth, world.worldHeight)) continue
    if (isHerbivore && currentHerbivores >= getHerbivorePopulationCap(world.worldWidth, world.worldHeight)) continue
    if (isOmnivore && currentOmnivores >= getOmnivorePopulationCap(world.worldWidth, world.worldHeight)) continue

    // Adult check (Wait 30s)
    if (creature.age < 30) continue

    // Probabilistic trigger
    if (random() > reproChance * dt) continue

    const baby = spawnBaby(creature, world.worldWidth, world.worldHeight, cooldown)
    babies.push(baby)
    if (isCarnivore) currentCarnivores++
    else if (isHerbivore) currentHerbivores++
    else if (isOmnivore) currentOmnivores++

    creature.reproductionCooldown = cooldown
  }

  return babies
}

import { generateTintedImage } from '../renderer/imageCache'
import { calculateCreatureStats } from './creatureFactory'

export function spawnBaby(parent: Creature, worldWidth: number, worldHeight: number, cooldown: number): Creature {
  const rawX  = parent.x + parent.direction.vx * REPRO_SPAWN_OFFSET
  const rawY  = parent.y + parent.direction.vy * REPRO_SPAWN_OFFSET
  
  const babyX = Math.max(10, Math.min(worldWidth - 10, rawX))
  const babyY = Math.max(10, Math.min(worldHeight - 10, rawY))

  // Get the biological baseline for this species
  const baseline = calculateCreatureStats(parent.size, parent.movement, parent.diet, parent.decals)
  const maxCap = 3.0 // Mutations cannot exceed 3x the baseline

  // Note for future devs: mutate() blindly multiplies stats, but it's mathematically safe
  // because the lines below it strictly clamp everything with Math.max/Math.min.
  // It literally can't spit out NaNs or Infinite stats into the baby.
  const mutate = (base: number, maxPct: number) => base * (1 + (random() * maxPct * 2 - maxPct))
  const speed = Math.min(baseline.speed * maxCap, Math.max(10, mutate(parent.baseStats.speed, 0.05)))
  const sightRadius = Math.min(baseline.sight * maxCap, Math.max(50, mutate(parent.baseStats.sightRadius, 0.05)))
  const maxHealth = Math.min(baseline.maxHealth * maxCap, Math.max(10, mutate(parent.baseStats.maxHealth, 0.05)))
  const renderScale = Math.min(baseline.renderScale * maxCap, Math.max(0.2, mutate(parent.baseStats.renderScale, 0.02)))
  const damage = Math.min(baseline.damage * maxCap, Math.max(1, mutate(parent.baseStats.damage, 0.05)))
  const hueShift = Math.floor((parent.hueShift + (random() * 30 - 15)) + 360) % 360
  const bravery = Math.min(1, Math.max(0, parent.bravery + (random() * 0.2 - 0.1)))

  // Metabolic Cost Formula
  const speedFactor = speed / parent.baseStats.speed
  const sightFactor = sightRadius / parent.baseStats.sightRadius
  const healthFactor = maxHealth / parent.baseStats.maxHealth
  const scaleFactor = renderScale / parent.baseStats.renderScale
  const damageFactor = damage / parent.baseStats.damage
  const hungerDrainRate = parent.baseDrainRate * (speedFactor * 0.3 + sightFactor * 0.2 + scaleFactor * 0.2 + healthFactor * 0.15 + damageFactor * 0.15)

  const id = crypto.randomUUID()
  
  if (parent.bakedSprites) {
    generateTintedImage(`${id}_IDLE`, parent.bakedSprites.IDLE, hueShift);
    generateTintedImage(`${id}_SLEEPING`, parent.bakedSprites.SLEEPING, hueShift);
    generateTintedImage(`${id}_EATING`, parent.bakedSprites.EATING, hueShift);
    generateTintedImage(`${id}_FIGHTING`, parent.bakedSprites.FIGHTING, hueShift);
  } else {
    generateTintedImage(id, parent.drawingData, hueShift);
  }

  // Parent pays biological cost for reproducing
  parent.hunger = Math.max(0, parent.hunger - 40)
  parent.health = Math.max(1, parent.health - 10)

  return {
    ...parent,
    id,
    x: babyX,
    y: babyY,
    z: 0,
    baseStats: { speed, sightRadius, maxHealth, renderScale, damage },
    baseDrainRate: hungerDrainRate,
    speed,
    sightRadius,
    maxHealth,
    maxStamina: 100, // Stamina is hardcoded globally
    renderScale,
    damage,
    hueShift,
    hungerDrainRate,
    health: maxHealth,
    hunger: STARTING_HUNGER,
    stamina: 100, // Stamina is hardcoded globally
    lungeTimer: 0,
    lungeCooldownTimer: 0,
    age: 0,
    maxAge: (parent.diet === 'CARNIVORE' ? 420 : 300) * (0.8 + random() * 0.4),
    generation: parent.generation + 1,
    currentScale: 0.5,
    panicTimer: 0,
    state: 'IDLE',
    behavior: 'WANDERING',
    mood: 'HAPPY',
    intent: 'Just born!',
    kills: 0,
    foodEaten: 0,
    level: 1,
    bravery: bravery,
    targetId: null,
    direction: { vx: -parent.direction.vx, vy: -parent.direction.vy },
    hopPhase: random() * Math.PI * 2,
    hopPauseTimer: 0,
    pacerMoveTimer: 0,
    pacerPauseTimer: 0,
    pacerPaused: false,
    reproductionCooldown: cooldown,
  }
}
