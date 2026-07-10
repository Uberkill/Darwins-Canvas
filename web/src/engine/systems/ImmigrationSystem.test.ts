import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImmigrationSystem } from './ImmigrationSystem'
import { createMockWorld, createMockCreature } from '../../test/factories'
import { setRandomFn } from '../random'

vi.mock('../audioEngine', () => ({
  audio: { playLevelUp: vi.fn(), playCreatureEvent: vi.fn() }
}))

describe('ImmigrationSystem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setRandomFn(Math.random)
  })

  it('queues nothing when timer < 60s', () => {
    const world = createMockWorld()
    world.scratchpad.immigrationTimer = 0
    ImmigrationSystem.update(world, 30)
    expect(world.scratchpad.pendingImmigrations?.length || 0).toBe(0)
  })

  it('resets timer to 0 when it exceeds 60s', () => {
    const world = createMockWorld()
    world.scratchpad.immigrationTimer = 59
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 2) // 59+2=61 > 60
    expect(world.scratchpad.immigrationTimer).toBe(0)
  })

  it('queues nothing when world is at population cap', () => {
    const creatures = []
    for (let i = 0; i < 500; i++) creatures.push(createMockCreature())
    const world = createMockWorld({ creatures, worldWidth: 1000, worldHeight: 1000 })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 0)
    expect(world.scratchpad.pendingImmigrations?.length || 0).toBe(0)
  })

  it('queues herbivore pair when herbivores extinct and carnivores ≤ 3', () => {
    // 2 carnivores, 0 herbivores — carnivores <= 3, so it is safe to send
    const world = createMockWorld({
      creatures: [
        createMockCreature({ diet: 'CARNIVORE' }),
        createMockCreature({ diet: 'CARNIVORE' }),
        createMockCreature({ diet: 'OMNIVORE' }),
      ]
    })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 0)
    const q = world.scratchpad.pendingImmigrations || []
    const herbs = q.filter(d => d === 'HERBIVORE')
    expect(herbs.length).toBeGreaterThanOrEqual(2) // guaranteed founding pair
  })

  it('does NOT queue herbivores when carnivore count > 3 (too dangerous)', () => {
    // 5 carnivores — immigrants would be eaten immediately
    const world = createMockWorld({
      creatures: Array.from({ length: 5 }, () => createMockCreature({ diet: 'CARNIVORE' }))
    })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 0)
    const q = world.scratchpad.pendingImmigrations || []
    expect(q.includes('HERBIVORE')).toBe(false)
  })

  it('does NOT queue carnivore when prey count < 3 (nothing to eat)', () => {
    // 0 carnivores, only 1 herbivore — not enough prey to sustain a carnivore
    const world = createMockWorld({
      creatures: [createMockCreature({ diet: 'HERBIVORE' })]
    })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 0)
    const q = world.scratchpad.pendingImmigrations || []
    expect(q.includes('CARNIVORE')).toBe(false)
  })

  it('queues carnivore when prey ≥ 3 and carnivores extinct', () => {
    const world = createMockWorld({
      creatures: [
        createMockCreature({ diet: 'HERBIVORE' }),
        createMockCreature({ diet: 'HERBIVORE' }),
        createMockCreature({ diet: 'HERBIVORE' }),
      ]
    })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01) // < 0.25, fires
    ImmigrationSystem.update(world, 0)
    const q = world.scratchpad.pendingImmigrations || []
    expect(q.includes('CARNIVORE')).toBe(true)
  })

  it('all extinct with 0 carnivores: queues 3H + 0C + 2O (carn blocked by prey guard)', () => {
    const world = createMockWorld({ creatures: [] })
    world.scratchpad.immigrationTimer = 61
    setRandomFn(() => 0.01)
    ImmigrationSystem.update(world, 0)
    const q = world.scratchpad.pendingImmigrations || []
    expect(q.length).toBe(5)
    expect(q.filter(d => d === 'HERBIVORE').length).toBe(3)
    expect(q.filter(d => d === 'CARNIVORE').length).toBe(0) // no prey yet!
    expect(q.filter(d => d === 'OMNIVORE').length).toBe(2)
  })
})
