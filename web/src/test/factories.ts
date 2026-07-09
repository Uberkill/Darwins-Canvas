import type { WorldState, Creature, Plant } from '../types'
import { calculateCreatureStats } from '../engine/creatureFactory'
import { SpatialGrid } from '../engine/SpatialGrid'

export function createMockWorld(overrides: Partial<WorldState> = {}): WorldState {
  return {
    creatures: [],
    plants: [],
    plantSpawnTimer: 0,
    activeLure: null,
    totalTime: 0,
    worldWidth: 2560,
    worldHeight: 1267,
    mapSizeMultiplier: 1,
    mouseX: 0,
    mouseY: 0,
    hoveredEntityId: null,
    flags: { boundsChanged: false },
    timeOfDay: 0.1,
    weather: 'CLEAR',
    camera: { x: 1280, y: 633.5, zoom: 1.0 },
    scratchpad: {
      deletedCreatureIds: new Set(),
      deletedPlantIds: new Set(),
      spatialGrid: new SpatialGrid(800, 600, 100)
    },
    draggedEntityId: null,
    isPaused: false,
    analytics: {
      currentSecondAccumulator: {
        birthsCarn: 0, birthsOmni: 0, birthsHerb: 0,
        starvationCarn: 0, starvationOmni: 0, starvationHerb: 0,
        huntedCarn: 0, huntedOmni: 0, huntedHerb: 0,
        damageCarn: 0, damageOmni: 0, damageHerb: 0,
        caloriesCarn: 0, caloriesOmni: 0, caloriesHerb: 0,
      },
      history: []
    },
    historyTimer: 0,
    ...overrides
  }
}

export function createMockCreature(overrides: Partial<Creature> = {}): Creature {
  const size = overrides.size || 'MEDIUM'
  const diet = overrides.diet || 'HERBIVORE'
  const movement = overrides.movement || 'CRAWLER'
  const decals = overrides.decals || []
  
  const stats = calculateCreatureStats(size, movement, diet, decals)

  return {
    id: overrides.id || crypto.randomUUID(),
    name: overrides.name || 'Test Creature',
    drawingData: overrides.drawingData || '',
    x: overrides.x || 1000,
    y: overrides.y || 1000,
    z: overrides.z || 0,
    size,
    movement,
    diet,
    speed: stats.speed,
    hungerDrainRate: stats.drain,
    renderScale: stats.renderScale,
    maxHealth: stats.maxHealth,
    damage: stats.damage,
    health: overrides.health ?? stats.maxHealth,
    hunger: overrides.hunger ?? 80,
    direction: overrides.direction || { vx: 0, vy: 0 },
    state: overrides.state || 'IDLE',
    behavior: overrides.behavior || 'WANDERING',
    targetId: overrides.targetId || null,
    sightRadius: stats.sight,
    age: overrides.age || 0,
    maxAge: overrides.maxAge || 600,
    generation: overrides.generation || 1,
    currentScale: overrides.currentScale || 1.0,
    panicTimer: overrides.panicTimer || 0,

    lungeCooldownTimer: overrides.lungeCooldownTimer || 0,
    eatingTimer: overrides.eatingTimer || 0,
    hopPhase: overrides.hopPhase || 0,
    hopPauseTimer: overrides.hopPauseTimer || 0,
    pacerMoveTimer: overrides.pacerMoveTimer || 0,
    stamina: overrides.stamina ?? 100,
    maxStamina: overrides.maxStamina ?? 100,
    lungeTimer: overrides.lungeTimer || 0,
    pacerPauseTimer: overrides.pacerPauseTimer || 0,
    pacerPaused: overrides.pacerPaused || false,
    reproductionCooldown: overrides.reproductionCooldown || 0,
    bravery: overrides.bravery ?? Math.min(1.0, Math.max(0.0, stats.braveryBonus)),
    kills: overrides.kills || 0,
    foodEaten: overrides.foodEaten || 0,
    level: overrides.level || 1,
    mood: overrides.mood || 'HAPPY',
    intent: overrides.intent || '',
    decals,
    hueShift: overrides.hueShift || 0,
    baseDrainRate: overrides.baseDrainRate || stats.drain,
    baseStats: overrides.baseStats || {
      speed: stats.speed,
      sightRadius: stats.sight,
      maxHealth: stats.maxHealth,
      renderScale: stats.renderScale,
      damage: stats.damage
    },
    hitTimer: overrides.hitTimer || 0,
    ...overrides
  }
}

export function createMockPlant(overrides: Partial<Plant> = {}): Plant {
  return {
    id: overrides.id || crypto.randomUUID(),
    type: overrides.type || 'PLANT',
    x: overrides.x || 1000,
    y: overrides.y || 1000,
    growthStage: overrides.growthStage ?? 1.0,
    wobblePhase: overrides.wobblePhase || 0,
    ...overrides
  }
}
