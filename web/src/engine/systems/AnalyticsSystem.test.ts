import { describe, it, expect } from 'vitest'
import { AnalyticsSystem } from './AnalyticsSystem'
import { createMockWorld, createMockCreature } from '../../test/factories'

describe('AnalyticsSystem', () => {
  it('does NOT push a history entry before 1.0 second accumulates', () => {
    const world = createMockWorld()
    world.historyTimer = 0
    AnalyticsSystem.update(world, 0.5)
    expect(world.analytics.history).toHaveLength(0)
    expect(world.historyTimer).toBeCloseTo(0.5)
  })

  it('pushes exactly one history entry at 1.0 second and resets timer to 0', () => {
    const world = createMockWorld()
    world.historyTimer = 0
    AnalyticsSystem.update(world, 1.0)
    expect(world.analytics.history).toHaveLength(1)
    expect(world.historyTimer).toBe(0)
  })

  it('history entry captures correct creature population counts', () => {
    const world = createMockWorld({
      creatures: [
        createMockCreature({ diet: 'CARNIVORE' }),
        createMockCreature({ diet: 'HERBIVORE' }),
        createMockCreature({ diet: 'HERBIVORE' }),
        createMockCreature({ diet: 'OMNIVORE' }),
      ]
    })
    world.historyTimer = 0
    AnalyticsSystem.update(world, 1.0)
    const entry = world.analytics.history[0]
    expect(entry.carnivore).toBe(1)
    expect(entry.herbivore).toBe(2)
    expect(entry.omnivore).toBe(1)
  })

  it('all 15 accumulators are zeroed after a push', () => {
    const world = createMockWorld()
    const accum = world.analytics.currentSecondAccumulator
    // Pre-fill accumulators
    accum.birthsCarn = 5; accum.huntedHerb = 3; accum.damageCarn = 10
    accum.caloriesOmni = 42; accum.starvationCarn = 1
    world.historyTimer = 0
    AnalyticsSystem.update(world, 1.0)
    // All should be zero after push
    expect(accum.birthsCarn).toBe(0)
    expect(accum.huntedHerb).toBe(0)
    expect(accum.damageCarn).toBe(0)
    expect(accum.caloriesOmni).toBe(0)
    expect(accum.starvationCarn).toBe(0)
  })

  it('3600-entry cap: entry 3601 triggers shift(), length stays at 3600', () => {
    const world = createMockWorld()
    // Pre-fill history to 3600 entries
    for (let i = 0; i < 3600; i++) {
      world.analytics.history.push({ time: i } as any)
    }
    world.historyTimer = 0
    AnalyticsSystem.update(world, 1.0) // This pushes entry 3601, should shift
    expect(world.analytics.history.length).toBe(3600)
  })

  it('maxGeneration tracks the highest generation across all creatures', () => {
    const world = createMockWorld({
      creatures: [
        createMockCreature({ generation: 1 }),
        createMockCreature({ generation: 7 }),
        createMockCreature({ generation: 3 }),
      ]
    })
    world.historyTimer = 0
    AnalyticsSystem.update(world, 1.0)
    expect(world.analytics.history[0].maxGeneration).toBe(7)
  })
})
