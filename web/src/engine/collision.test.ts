import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runCollision } from './collision'
import { createMockWorld, createMockCreature } from '../test/factories'
import { SpatialGrid } from './SpatialGrid'

vi.mock('./audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn(),
    playBGM: vi.fn(),
  }
}))

describe('Collision Math Hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('safely handles two entities at the exact same pixel without NaN propagation', () => {
    const c1 = createMockCreature({ x: 100, y: 100, size: 'MEDIUM' })
    const c2 = createMockCreature({ x: 100, y: 100, size: 'MEDIUM' })
    
    const world = createMockWorld({ creatures: [c1, c2] })
    world.scratchpad.spatialGrid = new SpatialGrid(1000, 1000, 150)
    world.scratchpad.spatialGrid.insertCreature(c1)
    world.scratchpad.spatialGrid.insertCreature(c2)

    expect(() => {
      runCollision(world, 1/60)
    }).not.toThrow()

    expect(Number.isNaN(c1.direction.vx)).toBe(false)
    expect(Number.isNaN(c1.direction.vy)).toBe(false)
    expect(Number.isNaN(c2.direction.vx)).toBe(false)
    expect(Number.isNaN(c2.direction.vy)).toBe(false)
  })
})
