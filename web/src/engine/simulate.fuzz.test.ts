import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simulate } from './simulate'
import { createMockWorld, createMockCreature, createMockPlant } from '../test/factories'
import fc from 'fast-check'

vi.mock('./audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn(),
    playBGM: vi.fn(),
    updateTimeOfDay: vi.fn(),
  }
}))

describe('simulate property-based testing (Fuzzing)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('never throws regardless of extreme delta time (dt)', () => {
    // Generate weird floats, NaN, negative, huge numbers
    fc.assert(
      fc.property(
        fc.float({ noDefaultInfinity: false, noNaN: false }), 
        (randomDt) => {
          const world = createMockWorld({
            creatures: [createMockCreature({ diet: 'CARNIVORE' })],
            plants: [createMockPlant()]
          })

          // We expect the engine to either process it or safely ignore it, but NEVER throw.
          // Because of our try/catch wrapper in useGameLoop, simulate itself should be robust
          // to any dt value, though internally it handles fixed steps. But what if we feed simulate directly?
          // Let's test simulate directly.
          try {
            simulate(world, randomDt)
          } catch (e) {
            // It should only throw if it's a fatal math bug, not a typical error
            // (Actually we don't want it to throw at all)
            throw new Error(`Simulate threw an error with dt=${randomDt}: ${e}`)
          }
          expect(true).toBe(true) // If we got here, we survived
        }
      ),
      { numRuns: 1000 }
    )
  })

  it('safely handles extreme creature coordinate fuzzing', () => {
    fc.assert(
      fc.property(
        fc.float(), fc.float(), fc.float(), fc.float(),
        (x1, y1, x2, y2) => {
          const world = createMockWorld({
            creatures: [
              createMockCreature({ x: x1, y: y1 }),
              createMockCreature({ x: x2, y: y2 })
            ]
          })
          
          expect(() => {
            simulate(world, 1/60)
          }).not.toThrow()
        }
      ),
      { numRuns: 1000 }
    )
  })
})
