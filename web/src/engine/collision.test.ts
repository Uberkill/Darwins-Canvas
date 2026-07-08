import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runCollision } from './collision'
import { createMockWorld, createMockCreature } from '../test/factories'

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
    // If two creatures are exactly at 100, 100, the dx and dy are 0.
    // Length is 0. Normalizing by dividing by 0 results in NaN if not protected.
    const c1 = createMockCreature({ x: 100, y: 100, size: 'MEDIUM' })
    const c2 = createMockCreature({ x: 100, y: 100, size: 'MEDIUM' })
    
    const world = createMockWorld({ creatures: [c1, c2] })

    // Process collisions (which does separation forces)
    expect(() => {
      runCollision(world, 1/60)
    }).not.toThrow()

    // Validate no NaN crept into their directions
    expect(Number.isNaN(c1.direction.vx)).toBe(false)
    expect(Number.isNaN(c1.direction.vy)).toBe(false)
    expect(Number.isNaN(c2.direction.vx)).toBe(false)
    expect(Number.isNaN(c2.direction.vy)).toBe(false)
    
    // In our engine, we add a tiny Math.random() jitter if len === 0, 
    // so they should ideally push apart slightly instead of staying exactly at 0.
  })
})
