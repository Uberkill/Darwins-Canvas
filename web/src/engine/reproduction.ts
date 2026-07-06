import type { Creature, WorldState } from '../types'
import {
  REPRO_CHANCE_PER_SEC, REPRO_SPAWN_OFFSET, STARTING_HUNGER,
  GLOBAL_POPULATION_CAP, CARNIVORE_POPULATION_CAP,
  HERBIVORE_REPRO_THRESHOLD, HERBIVORE_REPRO_COOLDOWN,
  CARNIVORE_REPRO_THRESHOLD, CARNIVORE_REPRO_COOLDOWN,
} from '../constants'

/**
 * reproduction.ts — simple asexual reproduction for ecosystem longevity.
 */
export function checkReproduction(
  world: WorldState,
  dt: number,
  excludeIds: Set<string> = new Set(),
): Creature[] {
  if (world.creatures.length >= GLOBAL_POPULATION_CAP) return []

  const babies: Creature[] = []
  
  let currentCarnivores = 0
  for (const c of world.creatures) {
    if (c.diet === 'CARNIVORE') currentCarnivores++
  }

  for (const creature of world.creatures) {
    if (excludeIds.has(creature.id)) continue

    if (creature.reproductionCooldown > 0) {
      creature.reproductionCooldown -= dt
      continue
    }

    const isCarnivore = creature.diet === 'CARNIVORE'
    const threshold = isCarnivore ? CARNIVORE_REPRO_THRESHOLD : HERBIVORE_REPRO_THRESHOLD
    const cooldown  = isCarnivore ? CARNIVORE_REPRO_COOLDOWN : HERBIVORE_REPRO_COOLDOWN

    if (creature.hunger < threshold) continue

    // Global cap check
    if (world.creatures.length + babies.length >= GLOBAL_POPULATION_CAP) break
    
    // Carnivore cap check
    if (isCarnivore && currentCarnivores >= CARNIVORE_POPULATION_CAP) continue

    // Adult check (Wait 30s)
    if (creature.age < 30) continue

    // Probabilistic trigger
    if (Math.random() > REPRO_CHANCE_PER_SEC * dt) continue

    const baby = spawnBaby(creature, world.worldWidth, world.worldHeight, cooldown)
    babies.push(baby)
    if (isCarnivore) currentCarnivores++

    creature.reproductionCooldown = cooldown
  }

  return babies
}

import { generateTintedImage } from '../renderer/imageCache'

function spawnBaby(parent: Creature, worldWidth: number, worldHeight: number, cooldown: number): Creature {
  const rawX  = parent.x + parent.direction.vx * REPRO_SPAWN_OFFSET
  const rawY  = parent.y + parent.direction.vy * REPRO_SPAWN_OFFSET
  
  const babyX = Math.max(10, Math.min(worldWidth - 10, rawX))
  const babyY = Math.max(10, Math.min(worldHeight - 10, rawY))

  // Mutations
  const mutate = (base: number, maxPct: number) => base * (1 + (Math.random() * maxPct * 2 - maxPct))
  const speed = Math.max(10, mutate(parent.speed, 0.05))
  const sightRadius = Math.max(50, mutate(parent.sightRadius, 0.05))
  const maxHealth = Math.max(10, mutate(parent.maxHealth, 0.05))
  const maxStamina = Math.max(10, mutate(parent.maxStamina, 0.05))
  const renderScale = Math.max(0.2, mutate(parent.renderScale, 0.02))
  const hueShift = Math.floor((parent.hueShift + (Math.random() * 30 - 15)) + 360) % 360
  const bravery = Math.max(0, Math.min(1, parent.bravery + (Math.random() * 0.2 - 0.1)))

  // Metabolic Cost Formula
  const speedFactor = speed / parent.baseStats.speed
  const sightFactor = sightRadius / parent.baseStats.sightRadius
  const healthFactor = maxHealth / parent.baseStats.maxHealth
  const scaleFactor = renderScale / parent.baseStats.renderScale
  const hungerDrainRate = parent.baseDrainRate * (speedFactor * 0.4 + sightFactor * 0.2 + scaleFactor * 0.2 + healthFactor * 0.2)

  const id = crypto.randomUUID()
  generateTintedImage(id, parent.drawingData, hueShift)

  // Parent pays biological cost for reproducing
  parent.hunger = Math.max(0, parent.hunger - 30)
  parent.health = Math.max(1, parent.health - 10)

  return {
    ...parent,
    id,
    x: babyX,
    y: babyY,
    z: 0,
    speed,
    sightRadius,
    maxHealth,
    maxStamina,
    renderScale,
    hueShift,
    hungerDrainRate,
    health: maxHealth,
    hunger: STARTING_HUNGER,
    stamina: maxStamina,
    lungeTimer: 0,
    lungeCooldownTimer: 0,
    age: 0,
    generation: parent.generation + 1,
    currentScale: 0.5,
    state: 'IDLE',
    behavior: 'WANDERING',
    mood: 'HAPPY',
    intent: 'Just born!',
    kills: 0,
    bravery: bravery,
    targetId: null,
    direction: { vx: -parent.direction.vx, vy: -parent.direction.vy },
    hopPhase: Math.random() * Math.PI * 2,
    hopPauseTimer: 0,
    pacerMoveTimer: 0,
    pacerPauseTimer: 0,
    pacerPaused: false,
    reproductionCooldown: cooldown,
  }
}
