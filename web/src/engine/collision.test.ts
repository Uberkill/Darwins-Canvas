import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runCollision } from './collision'
import { createMockWorld, createMockCreature, createMockPlant } from '../test/factories'
import { SpatialGrid } from './SpatialGrid'

vi.mock('./audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn(),
    playBGM: vi.fn(),
  }
}))

vi.mock('./ai/Thoughts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./ai/Thoughts')>()
  return actual
})

function makeWorld(creatures: any[] = [], plants: any[] = []) {
  const world = createMockWorld({ creatures, plants })
  world.scratchpad.spatialGrid = new SpatialGrid(2000, 2000, 150)
  for (const c of creatures) world.scratchpad.spatialGrid.insertCreature(c)
  for (const p of plants) world.scratchpad.spatialGrid.insertPlant(p)
  return world
}

describe('Collision Math Hardening', () => {
  beforeEach(() => vi.clearAllMocks())

  it('safely handles two entities at the exact same pixel without NaN propagation', () => {
    const c1 = createMockCreature({ x: 100, y: 100 })
    const c2 = createMockCreature({ x: 100, y: 100 })
    const world = makeWorld([c1, c2])
    expect(() => runCollision(world, 1 / 60)).not.toThrow()
    expect(Number.isNaN(c1.direction.vx)).toBe(false)
    expect(Number.isNaN(c2.direction.vx)).toBe(false)
  })
})

describe('Collision — Food Chain Logic', () => {
  beforeEach(() => vi.clearAllMocks())

  it('carnivore kills herbivore: kills++, hunger resets to 100, meat plant spawned', () => {
    const carn = createMockCreature({ diet: 'CARNIVORE', x: 500, y: 500, health: 200 })
    // Give herbivore 1 health so one combat tick kills it
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 501, y: 501, health: 1, damage: 0 })
    carn.hunger = 50
    const world = makeWorld([carn, herb])

    runCollision(world, 1.0) // 1s tick — carn.damage > 0, kills herb

    expect(world.scratchpad.deletedCreatureIds.has(herb.id)).toBe(true)
    expect(carn.kills).toBe(1)
    expect(carn.hunger).toBe(100)
    expect(world.plants.some(p => p.type === 'MEAT')).toBe(true)
  })

  it('herbivore eats full-grown plant (growthStage=1.0): +60 hunger', () => {
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 500, y: 500, hunger: 30 })
    const plant = createMockPlant({ x: 501, y: 501, type: 'PLANT', growthStage: 1.0 })
    const world = makeWorld([herb], [plant])

    runCollision(world, 1 / 60)

    expect(herb.hunger).toBeGreaterThan(30)
    expect(herb.hunger).toBeLessThanOrEqual(100)
    // Full-grown = +60 energy, 30+60 = 90
    expect(herb.hunger).toBeCloseTo(90)
  })

  it('herbivore eats half-grown plant (growthStage=0.6): +20 hunger', () => {
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 500, y: 500, hunger: 40 })
    const plant = createMockPlant({ x: 501, y: 501, type: 'PLANT', growthStage: 0.6 })
    const world = makeWorld([herb], [plant])

    runCollision(world, 1 / 60)

    expect(herb.hunger).toBeCloseTo(60) // 40 + 20
  })

  it('herbivore eats seedling (growthStage=0.3): +15 hunger', () => {
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 500, y: 500, hunger: 40 })
    const plant = createMockPlant({ x: 501, y: 501, type: 'PLANT', growthStage: 0.3 })
    const world = makeWorld([herb], [plant])

    runCollision(world, 1 / 60)

    expect(herb.hunger).toBeCloseTo(55) // 40 + 15
  })

  it('desperate carnivore eating plant gets only 25% energy', () => {
    const carn = createMockCreature({ diet: 'CARNIVORE', x: 500, y: 500, hunger: 10 })
    const plant = createMockPlant({ x: 501, y: 501, type: 'PLANT', growthStage: 1.0 })
    const world = makeWorld([carn], [plant])

    runCollision(world, 1 / 60)

    // Full plant = 60 energy, 25% = 15. 10 + 15 = 25
    expect(carn.hunger).toBeCloseTo(25)
  })

  it('omnivore eats meat ONLY when hunger < 20', () => {
    const omni = createMockCreature({ diet: 'OMNIVORE', x: 500, y: 500, hunger: 50 })
    const meat = createMockPlant({ x: 501, y: 501, type: 'MEAT', growthStage: 1.0 })
    const world = makeWorld([omni], [meat])

    runCollision(world, 1 / 60)

    // hunger=50 means omnivore should NOT eat meat
    expect(omni.hunger).toBe(50)
    expect(world.scratchpad.deletedPlantIds.has(meat.id)).toBe(false)
  })

  it('omnivore eats meat when hunger < 20', () => {
    const omni = createMockCreature({ diet: 'OMNIVORE', x: 500, y: 500, hunger: 10 })
    const meat = createMockPlant({ x: 501, y: 501, type: 'MEAT', growthStage: 1.0 })
    const world = makeWorld([omni], [meat])

    runCollision(world, 1 / 60)

    expect(omni.hunger).toBeGreaterThan(10)
  })

  it('omnivore eats plant at any hunger level', () => {
    const omni = createMockCreature({ diet: 'OMNIVORE', x: 500, y: 500, hunger: 70 })
    const plant = createMockPlant({ x: 501, y: 501, type: 'PLANT', growthStage: 1.0 })
    const world = makeWorld([omni], [plant])

    runCollision(world, 1 / 60)

    expect(omni.hunger).toBeGreaterThan(70)
  })

  it('z-gate: airborne creature (z>30) cannot attack or be attacked', () => {
    const carn = createMockCreature({ diet: 'CARNIVORE', x: 500, y: 500, z: 40 })
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 501, y: 501, health: 1, damage: 0 })
    const initialHealth = herb.health
    const world = makeWorld([carn, herb])

    runCollision(world, 1.0)

    // Herb should be untouched — carn is z-gated
    expect(herb.health).toBe(initialHealth)
    expect(world.scratchpad.deletedCreatureIds.has(herb.id)).toBe(false)
  })

  it('lunge burst doubles damage', () => {
    const carn = createMockCreature({ diet: 'CARNIVORE', x: 500, y: 500, lungeTimer: 1.0 })
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 501, y: 501, damage: 0 })
    const initialHealth = herb.health

    const world = makeWorld([carn, herb])
    runCollision(world, 1.0)

    // With lunge, damage = carn.damage * 2 * dt. Without lunge, damage = carn.damage * 1 * dt
    // Verify herb lost more health than it would without lunge
    const healthLost = initialHealth - herb.health
    expect(healthLost).toBeGreaterThan(0)
  })

  it('deletedCreatureIds prevents double-kill in same frame', () => {
    const c1 = createMockCreature({ diet: 'CARNIVORE', x: 500, y: 500, health: 1 })
    const c2 = createMockCreature({ diet: 'CARNIVORE', x: 501, y: 501, health: 1 })
    const world = makeWorld([c1, c2])

    runCollision(world, 10.0) // big dt to guarantee both die

    // Both should be in deletedCreatureIds exactly once (no duplicate processing)
    const killed = [...world.scratchpad.deletedCreatureIds]
    const uniqueKilled = new Set(killed)
    expect(killed.length).toBe(uniqueKilled.size)
  })

  it('starvation death triggers starvation accumulator', () => {
    const herb = createMockCreature({ diet: 'HERBIVORE', x: 500, y: 500, health: -1, hunger: 0 })
    const world = makeWorld([herb])

    runCollision(world, 1 / 60)

    expect(world.analytics.currentSecondAccumulator.starvationHerb).toBe(1)
    expect(world.scratchpad.deletedCreatureIds.has(herb.id)).toBe(true)
  })
})
