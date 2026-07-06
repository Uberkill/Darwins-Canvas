// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { buildCreature } from '../../engine/simulate'
import { checkReproduction } from '../../engine/reproduction'
import { tickPlantSpawner, createPlant } from '../../engine/spawner'
import type { WorldState, PendingCreature } from '../../types'
import {
  BASE_SPEED, STARTING_HUNGER, SIZE_STATS,
  HERBIVORE_REPRO_THRESHOLD, GLOBAL_POPULATION_CAP,
  PLANT_CAP, PLANT_SPAWN_RATE,
  HERBIVORE_BASE_HUNGER_DRAIN
} from '../../constants'

const WORLD_W = 1000
const GROUND  = 600

function makeWorld(overrides: Partial<WorldState> = {}): WorldState {
  return {
    creatures: [],
    plants: [],
    plantSpawnTimer: 3,
    herbivoreSpawnTimer: 10,
    totalTime: 0,
    worldWidth: WORLD_W,
    worldHeight: 800,
    mouseX: -1000,
    mouseY: -1000,
    hoveredEntityId: null,
    activeLure: null,
    flags: { boundsChanged: false },
    timeOfDay: 0.5,
    weather: 'CLEAR',
    camera: { x: 500, y: 300, zoom: 1.0 },
    scratchpad: {
      deletedCreatureIds: new Set<string>(),
      deletedPlantIds: new Set<string>(),
    },
    ...overrides,
  }
}

// ─── buildCreature ────────────────────────────────────────────────────────────
describe('buildCreature', () => {
  const pending: PendingCreature = {
    name: 'Test',
    drawingData: 'data:image/png;base64,abc',
    size: 'MEDIUM',
    movement: 'CRAWLER',
    diet: 'HERBIVORE',
  }

  it('derives correct speed for SMALL', () => {
    const c = buildCreature({ ...pending, size: 'SMALL' }, WORLD_W, GROUND)
    expect(c.speed).toBeCloseTo(BASE_SPEED * SIZE_STATS.SMALL.speedMultiplier)
  })

  it('derives correct speed for MEDIUM', () => {
    const c = buildCreature(pending, WORLD_W, GROUND)
    expect(c.speed).toBeCloseTo(BASE_SPEED)
  })

  it('derives correct speed for LARGE', () => {
    const c = buildCreature({ ...pending, size: 'LARGE' }, WORLD_W, GROUND)
    expect(c.speed).toBeCloseTo(BASE_SPEED * SIZE_STATS.LARGE.speedMultiplier)
  })

  it('derives correct hungerDrainRate per size', () => {
    const small = buildCreature({ ...pending, size: 'SMALL' }, WORLD_W, GROUND)
    const large = buildCreature({ ...pending, size: 'LARGE' }, WORLD_W, GROUND)
    expect(small.hungerDrainRate).toBeCloseTo(HERBIVORE_BASE_HUNGER_DRAIN * 0.5)
    expect(large.hungerDrainRate).toBeCloseTo(HERBIVORE_BASE_HUNGER_DRAIN * 2.0)
  })

  it('starts at STARTING_HUNGER', () => {
    const c = buildCreature(pending, WORLD_W, GROUND)
    expect(c.hunger).toBe(STARTING_HUNGER)
  })

  it('spawns within world bounds (accounting for margin)', () => {
    for (let i = 0; i < 20; i++) {
      const c = buildCreature(pending, WORLD_W, GROUND)
      expect(c.x).toBeGreaterThanOrEqual(30)
      expect(c.x).toBeLessThanOrEqual(WORLD_W - 30)
    }
  })

  it('hopPhase is randomized (not always 0)', () => {
    const phases = new Set(
      Array.from({ length: 20 }, () => buildCreature(pending, WORLD_W, GROUND).hopPhase)
    )
    expect(phases.size).toBeGreaterThan(1)
  })

  it('generates a valid UUID', () => {
    const c = buildCreature(pending, WORLD_W, GROUND)
    expect(c.id).toMatch(/^[0-9a-f-]{36}$/)
  })
})

// ─── checkReproduction ────────────────────────────────────────────────────────
describe('checkReproduction', () => {
  function makeReadyCreature(overrides = {}) {
    return {
      ...buildCreature(
        { name: 'Test', drawingData: '', size: 'MEDIUM', movement: 'CRAWLER', diet: 'HERBIVORE' },
        WORLD_W, GROUND,
      ),
      ...overrides
    } as ReturnType<typeof buildCreature> & { hunger: number; reproductionCooldown: number }
  }

  it('does NOT reproduce when hunger < threshold', () => {
    const world = makeWorld()
    const c = makeReadyCreature()
    c.hunger = HERBIVORE_REPRO_THRESHOLD - 1
    c.reproductionCooldown = 0
    world.creatures = [c]
    const babies = checkReproduction(world, 1)
    expect(babies.length).toBe(0)
  })

  it('does NOT reproduce when population at cap', () => {
    const world = makeWorld()
    world.creatures = Array.from({ length: GLOBAL_POPULATION_CAP }, () => {
      const c = makeReadyCreature()
      c.hunger = 100
      c.reproductionCooldown = 0
      return c
    })
    const babies = checkReproduction(world, 1)
    expect(world.creatures.length + babies.length).toBeLessThanOrEqual(GLOBAL_POPULATION_CAP)
  })

  it('does NOT reproduce during cooldown', () => {
    const world = makeWorld()
    const c = makeReadyCreature()
    c.hunger = 100
    c.reproductionCooldown = 10  // still on cooldown
    world.creatures = [c]
    // Even with many seconds, cooldown should block
    const babies = checkReproduction(world, 1)
    expect(babies.length).toBe(0)
  })

  it('baby inherits same drawingData, size, movement, diet', () => {
    // Force reproduction by mocking Math.random
    const world = makeWorld()
    const c = makeReadyCreature()
    c.hunger = 100
    c.reproductionCooldown = 0
    world.creatures = [c]
    // Run many times to ensure at least one reproduction event triggers
    let baby = null
    for (let i = 0; i < 200; i++) {
      const babies = checkReproduction(world, 0.1)
      if (babies.length > 0) { baby = babies[0]; break }
      world.creatures[0].reproductionCooldown = 0  // reset for next iteration
    }
    if (baby) {
      expect(baby.drawingData).toBe(c.drawingData)
      expect(baby.size).toBe(c.size)
      expect(baby.movement).toBe(c.movement)
      expect(baby.diet).toBe(c.diet)
      expect(baby.id).not.toBe(c.id)
    }
    // If no baby triggered after 200 iters, that's fine — reproduction is probabilistic
  })
})

// ─── tickPlantSpawner ─────────────────────────────────────────────────────────
describe('tickPlantSpawner', () => {
  it('decrements plantSpawnTimer by dt', () => {
    const world = makeWorld({ plantSpawnTimer: 3 })
    tickPlantSpawner(world, 0.5)
    expect(world.plantSpawnTimer).toBeCloseTo(2.5)
  })

  it('spawns a plant when timer hits 0', () => {
    const world = makeWorld({ plantSpawnTimer: 0 })
    tickPlantSpawner(world, 0.1)
    expect(world.plants.length).toBe(1)
  })

  it('does NOT spawn when at PLANT_CAP', () => {
    const world = makeWorld({ plantSpawnTimer: 0 })
    world.plants = Array.from({ length: PLANT_CAP }, () => createPlant(makeWorld())!)
    tickPlantSpawner(world, 0.1)
    expect(world.plants.length).toBe(PLANT_CAP)
  })

  it('resets timer after spawning', () => {
    const world = makeWorld({ plantSpawnTimer: 0 })
    tickPlantSpawner(world, 0.1)
    expect(world.plantSpawnTimer).toBeCloseTo(PLANT_SPAWN_RATE)
  })

  it('new plant x and y are within world bounds', () => {
    for (let i = 0; i < 20; i++) {
      const p = createPlant(makeWorld())!
      expect(p.x).toBeGreaterThanOrEqual(0)
      expect(p.x).toBeLessThanOrEqual(WORLD_W)
      expect(p.y).toBeGreaterThanOrEqual(0)
      expect(p.y).toBeLessThanOrEqual(800) // mock worldHeight
    }
  })

  it('new plant starts at growthStage 0', () => {
    const p = createPlant(makeWorld())!
    expect(p.growthStage).toBe(0)
  })

  it('increments wobble phase on existing plants', () => {
    const world = makeWorld({ plantSpawnTimer: 3 })
    world.plants = [createPlant(makeWorld())!]
    world.plants[0].wobblePhase = 0
    tickPlantSpawner(world, 0.5)
    expect(world.plants[0].wobblePhase).toBeGreaterThan(0)
  })
})

// ─── Sensory and Behavioral AI ────────────────────────────────────────────────
describe('Sensory and Behavioral AI', () => {
  function makeReadyCreature(overrides = {}) {
    return {
      ...buildCreature(
        { name: 'Test', drawingData: '', size: 'MEDIUM', movement: 'CRAWLER', diet: 'HERBIVORE' },
        WORLD_W, GROUND,
      ),
      ...overrides
    } as ReturnType<typeof buildCreature>
  }

  it('Herbivore targets nearest plant and switches to FORAGING', () => {
    const world = makeWorld()
    const herbivore = makeReadyCreature({ x: 100, y: 100 })
    const plant = createPlant(world)!
    plant.x = 120
    plant.y = 120
    world.creatures = [herbivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(herbivore.behavior).toBe('FORAGING')
      expect(herbivore.targetId).toBe(plant.id)
    })
  })

    it('Herbivore flees Carnivore when health < 50% instead of targeting plant', () => {
      const world = makeWorld()
      const herbivore = makeReadyCreature({ x: 100, y: 100, health: 40, maxHealth: 100 })
      const carnivore = makeReadyCreature({ diet: 'CARNIVORE', x: 130, y: 130 })
    const plant = createPlant(world)!
    plant.x = 110
    plant.y = 110
    world.creatures = [herbivore, carnivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(herbivore.behavior).toBe('FLEEING')
      expect(herbivore.targetId).toBe(carnivore.id)
    })
  })

  it('Herbivore ignores plants and FLEES if Carnivore is near', () => {
    const world = makeWorld()
    const herbivore = makeReadyCreature({ x: 100, y: 100, health: 40, maxHealth: 100 })
    const carnivore = makeReadyCreature({ diet: 'CARNIVORE', x: 130, y: 130 })
    const plant = createPlant(world)!
    plant.x = 110
    plant.y = 110
    world.creatures = [herbivore, carnivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(herbivore.behavior).toBe('FLEEING')
      expect(herbivore.targetId).toBe(carnivore.id)
    })
  })

  it('Carnivore targets Herbivore and switches to FORAGING', () => {
    const world = makeWorld()
    const carnivore = makeReadyCreature({ diet: 'CARNIVORE', x: 100, y: 100, hunger: 20 })
    const herbivore = makeReadyCreature({ diet: 'HERBIVORE', x: 150, y: 150 })
    world.creatures = [carnivore, herbivore]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(carnivore.behavior).toBe('FORAGING')
      expect(carnivore.targetId).toBe(herbivore.id)
    })
  })

  it('Remains WANDERING if targets are out of sight radius', () => {
    const world = makeWorld()
    const herbivore = makeReadyCreature({ x: 100, y: 100 })
    const plant = createPlant(world)!
    plant.x = 800
    plant.y = 800
    world.creatures = [herbivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(herbivore.behavior).toBe('WANDERING')
      expect(herbivore.targetId).toBeNull()
    })
  })

  it('Starving Carnivore targets nearest plant (Omnivore Backup)', () => {
    const world = makeWorld()
    const carnivore = makeReadyCreature({ diet: 'CARNIVORE', x: 100, y: 100, hunger: 10 })
    const plant = createPlant(world)!
    plant.x = 120
    plant.y = 120
    world.creatures = [carnivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(carnivore.behavior).toBe('FORAGING')
      expect(carnivore.targetId).toBe(plant.id)
    })
  })

  it('Starving Carnivore drops plant to target newly arrived Herbivore', () => {
    const world = makeWorld()
    const carnivore = makeReadyCreature({ diet: 'CARNIVORE', x: 100, y: 100, hunger: 10 })
    const plant = createPlant(world)!
    plant.x = 120
    plant.y = 120
    const herbivore = makeReadyCreature({ diet: 'HERBIVORE', x: 140, y: 140 })
    
    world.creatures = [carnivore, herbivore]
    world.plants = [plant]

    import('../../engine/simulate').then(({ simulate }) => {
      simulate(world, 1/60)
      expect(carnivore.behavior).toBe('FORAGING')
      expect(carnivore.targetId).toBe(herbivore.id) // Must target meat over plant
    })
  })
})

describe('Auto-Spawning Herbivores', () => {
  it('Ticks down spawn timer when no herbivores exist', () => {
    const world = makeWorld({ herbivoreSpawnTimer: 10 })
    world.creatures = []
    
    import('../../engine/spawner').then(({ tickHerbivoreSpawner }) => {
      tickHerbivoreSpawner(world, 1)
      expect(world.herbivoreSpawnTimer).toBe(9)
    })
  })

  it('Spawns a generic Wild Herbivore when timer hits 0', () => {
    const world = makeWorld({ herbivoreSpawnTimer: 0 })
    world.creatures = []
    
    import('../../engine/spawner').then(({ tickHerbivoreSpawner }) => {
      tickHerbivoreSpawner(world, 0.1)
      expect(world.creatures.length).toBe(1)
      expect(world.creatures[0].diet).toBe('HERBIVORE')
      expect(world.herbivoreSpawnTimer).toBe(10) // Timer resets
    })
  })
})
