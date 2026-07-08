import type { Creature, PendingCreature, CreatureSize, MovementType, DietType, Decal } from '../types'
import {
  BASE_SPEED, STARTING_HUNGER, SIZE_STATS,
  PACER_MOVE_DURATION, HERBIVORE_BASE_HUNGER_DRAIN, CARNIVORE_BASE_HUNGER_DRAIN,
  OMNIVORE_BASE_HUNGER_DRAIN, HERBIVORE_BASE_DAMAGE, CARNIVORE_BASE_DAMAGE,
  OMNIVORE_BASE_DAMAGE, BASE_HEALTH, SIGHT_RADIUS, MAX_STAMINA
} from '../constants'

export function calculateCreatureStats(
  size: CreatureSize,
  _movement: MovementType,
  diet: DietType,
  decals: Decal[]
) {
  const stats = SIZE_STATS[size]
  
  let baseDrain = HERBIVORE_BASE_HUNGER_DRAIN
  let baseDamage = HERBIVORE_BASE_DAMAGE
  if (diet === 'CARNIVORE') {
    baseDrain = CARNIVORE_BASE_HUNGER_DRAIN
    baseDamage = CARNIVORE_BASE_DAMAGE
  } else if (diet === 'OMNIVORE') {
    baseDrain = OMNIVORE_BASE_HUNGER_DRAIN
    baseDamage = OMNIVORE_BASE_DAMAGE
  }

  let decalSpeedMult = 1
  let decalDrainMult = 1
  let decalBravery = 0
  let decalDamageMult = 1
  let decalSightMult = 1

  for (const d of decals) {
    if (d.style === 'CARNIVORE_EYE') { decalSightMult += 0.15; decalBravery += 0.10 }
    else if (d.style === 'HERBIVORE_EYE') { decalSightMult += 0.20; decalSpeedMult += 0.05 }
    else if (d.style === 'INSECT_EYE') { decalSightMult += 0.30; decalBravery -= 0.15 }
    else if (d.style === 'NOCTURNAL_EYE') { decalSightMult += 0.25; decalDrainMult += 0.05 }
    else if (d.style === 'AQUATIC_EYE') { decalSightMult += 0.10; decalDrainMult -= 0.05 }
    else if (d.style === 'CARNIVORE_JAW') { decalDamageMult += 0.30; decalDrainMult += 0.10 }
    else if (d.style === 'BEAK') { decalSpeedMult += 0.15; decalDamageMult -= 0.05 }
    else if (d.style === 'HERBIVORE_JAW') { decalDrainMult -= 0.05; decalSpeedMult -= 0.05 }
    else if (d.style === 'PROBOSCIS') { decalDrainMult -= 0.08; decalDamageMult -= 0.08 }
    else if (d.style === 'BALEEN') { decalDrainMult -= 0.10; decalSpeedMult -= 0.08 }
  }

  const speed = Math.min(BASE_SPEED * stats.speedMultiplier * decalSpeedMult, BASE_SPEED * 3)
  const drain = Math.max(0.5, baseDrain * stats.hungerDrainMultiplier * decalDrainMult)
  const damage = Math.min(baseDamage * stats.damageMultiplier * decalDamageMult, baseDamage * 5)
  const sight = Math.min(SIGHT_RADIUS * decalSightMult, 800)
  const maxHealth = BASE_HEALTH * stats.healthMultiplier
  const braveryBonus = Math.max(0.0, Math.min(1.0, decalBravery))

  return { speed, drain, damage, sight, braveryBonus, maxHealth, renderScale: stats.renderScale }
}

export function buildCreature(
  pending: PendingCreature,
  worldWidth: number,
  worldHeight: number,
  generation: number = 1
): Creature {
  const angle = Math.random() * Math.PI * 2
  const decals = pending.decals || []
  
  const computed = calculateCreatureStats(pending.size, pending.movement, pending.diet, decals)
  const initialBravery = Math.max(0.0, Math.min(1.0, 0.5 + computed.braveryBonus + (Math.random() * 0.4 - 0.2)))

  return {
    id:          crypto.randomUUID(),
    name:        pending.name || 'Unknown',
    drawingData: pending.drawingData,
    decals:      decals,
    bakedSprites: pending.bakedSprites,

    x: 30 + Math.random() * (worldWidth - 60),
    y: 30 + Math.random() * (worldHeight - 60),
    z: 0,

    size:     pending.size,
    movement: pending.movement,
    diet:     pending.diet,

    speed:           computed.speed,
    hungerDrainRate: computed.drain,
    renderScale:     computed.renderScale,
    maxHealth:       computed.maxHealth,
    damage:          computed.damage,
    sightRadius:     computed.sight,

    bravery:   initialBravery,
    kills:     0,
    foodEaten: 0,
    level:     1,
    mood:      'HAPPY',
    intent:    'Just born!',

    hueShift: 0,
    baseDrainRate: computed.drain,
    baseStats: {
      speed: computed.speed,
      sightRadius: computed.sight,
      maxHealth: computed.maxHealth,
      renderScale: computed.renderScale,
      damage: computed.damage,
    },

    health:    computed.maxHealth,
    hunger:    STARTING_HUNGER,
    direction: { vx: Math.cos(angle), vy: Math.sin(angle) },
    state:     'IDLE',
    behavior:  'WANDERING',
    targetId:  null,
    age:       0,
    maxAge:    (pending.diet === 'CARNIVORE' ? 420 : 300) * (0.8 + Math.random() * 0.4),
    generation,
    currentScale: 0.5,
    panicTimer: 0,

    hopPhase:        Math.random() * Math.PI * 2,
    hopPauseTimer:   0,
    pacerMoveTimer:  PACER_MOVE_DURATION,
    pacerPauseTimer: 0,
    pacerPaused:     false,

    reproductionCooldown: 0,
    
    stamina: MAX_STAMINA,
    maxStamina: MAX_STAMINA,
    lungeTimer: 0,
    lungeCooldownTimer: 0,
    eatingTimer: 0,
    hitTimer: 0,
  }
}
