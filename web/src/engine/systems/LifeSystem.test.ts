import { describe, it, expect, vi } from 'vitest'
import { LifeSystem } from './LifeSystem'
import { buildCreature } from '../creatureFactory'
import type { WorldState } from '../../types'
import { createMockWorld, createMockCreature } from '../../test/factories'

vi.mock('../audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn()
  }
}))

function makeWorld(creatures = []): WorldState {
  return createMockWorld({ creatures }) as WorldState
}

describe('LifeSystem', () => {
  it('should drain hunger and age the creature', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'HERBIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    const initialHunger = c.hunger
    const world = makeWorld([c])
    LifeSystem.update(world, 1.0, 1.0)
    expect(c.age).toBe(1.0)
    expect(c.hunger).toBeLessThan(initialHunger)
  })

  it('should drain stamina while FORAGING (non-herbivore)', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'CARNIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    c.behavior = 'FORAGING'
    c.stamina = 10
    c.hunger = 30 // Below new catnap threshold of 40, so carnivore stays awake and forages
    const world = makeWorld([c])
    const initialStamina = c.stamina
    LifeSystem.update(world, 1.0, 1.0)
    expect(c.stamina).toBeLessThan(initialStamina)
  })

  it('senescence: creature past maxAge loses speed, damage, and maxHealth', () => {
    const c = createMockCreature({ diet: 'HERBIVORE', age: 400, maxAge: 200 })
    const initialSpeed = c.speed
    const initialDamage = c.damage
    const initialMaxHealth = c.maxHealth
    const world = makeWorld([c])
    LifeSystem.update(world, 0.016, 1.0)
    expect(c.speed).toBeLessThan(initialSpeed)
    expect(c.damage).toBeLessThan(initialDamage)
    expect(c.maxHealth).toBeLessThan(initialMaxHealth)
  })

  it('senescence hard death: overAge > 120 sets health to 0', () => {
    const c = createMockCreature({ age: 400, maxAge: 200 }) // overAge = 200 > 120
    const world = makeWorld([c])
    LifeSystem.update(world, 0.016, 1.0)
    expect(c.health).toBe(0)
  })

  it('baby scale: age < 30 → currentScale is between 0.5 and 1.5', () => {
    const c = createMockCreature({ age: 15 }) // halfway through ADULT_AGE=30
    const world = makeWorld([c])
    LifeSystem.update(world, 0.016, 1.0)
    // scale = 0.5 + (15/30) * 1.0 = 0.5 + 0.5 = 1.0
    expect(c.currentScale).toBeGreaterThan(0.5)
    expect(c.currentScale).toBeLessThan(1.5)
    expect(c.currentScale).toBeCloseTo(1.0, 1)
  })

  it('herbivore level-up: 20 foodEaten → level 3', () => {
    const c = createMockCreature({ diet: 'HERBIVORE', foodEaten: 20 })
    // newLevel = 1 + floor(sqrt(20/5)) = 1 + floor(sqrt(4)) = 1 + 2 = 3
    const world = makeWorld([c])
    LifeSystem.update(world, 0.016, 1.0)
    expect(c.level).toBe(3)
  })

  it('level > 10: maxAge gets +60s bonus per level', () => {
    const c = createMockCreature({ diet: 'HERBIVORE', level: 10, foodEaten: 500, maxAge: 200 })
    // With foodEaten=500: newLevel = 1 + floor(sqrt(500/5)) = 1 + floor(sqrt(100)) = 11
    const initialMaxAge = c.maxAge
    const world = makeWorld([c])
    LifeSystem.update(world, 0.016, 1.0)
    expect(c.level).toBeGreaterThan(10)
    expect(c.maxAge).toBeGreaterThan(initialMaxAge)
  })

  it('carnivore FORAGING triggers lunge when cooldown ready and stamina > 20', () => {
    // Carnivore catnaps during day when hunger > 60 — set hunger=30 to prevent sleeping
    const c = createMockCreature({ diet: 'CARNIVORE', hunger: 30 })
    c.behavior = 'FORAGING'
    c.lungeCooldownTimer = 0
    c.lungeTimer = 0
    c.stamina = 50
    const world = makeWorld([c])
    // globalSightPenalty=1.0 = full day. Carnivore hunger=30 < 60, so it stays awake.
    // LifeSystem checks: diet=CARNIVORE && behavior=FORAGING → triggers lunge
    LifeSystem.update(world, 0.016, 1.0)
    expect(c.lungeTimer).toBeGreaterThan(0)
    expect(c.lungeCooldownTimer).toBeGreaterThan(0)
  })

  it('sleeping herbivore at night: hunger drains at 20% rate', () => {
    const c = createMockCreature({ diet: 'HERBIVORE', hunger: 80, health: 100 })
    c.behavior = 'SLEEPING' as any
    c.hunger = 80
    const world = makeWorld([c])
    const initialHunger = c.hunger
    // globalSightPenalty < 0.9 = night
    LifeSystem.update(world, 1.0, 0.5)
    // drain = baseDrainRate * 0.2 * dt
    const normalDrain = c.baseDrainRate * 1.0
    const actualDrain = initialHunger - c.hunger
    expect(actualDrain).toBeLessThan(normalDrain)
  })
})
