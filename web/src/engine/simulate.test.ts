import { describe, it, expect, vi, beforeEach } from 'vitest'
import { simulate } from './simulate'
import { createMockWorld, createMockCreature, createMockPlant } from '../test/factories'

vi.mock('./audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn(),
    playBGM: vi.fn(),
    updateTimeOfDay: vi.fn(),
  }
}))

describe('simulate integration (Marathon Test)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should run 10,000 frames with a heavy ecosystem without crashing or producing NaN', () => {
    // 10 carnivores, 10 herbivores, 50 plants
    const creatures = []
    for (let i = 0; i < 10; i++) creatures.push(createMockCreature({ diet: 'CARNIVORE', name: `Carnivore ${i}` }))
    for (let i = 0; i < 10; i++) creatures.push(createMockCreature({ diet: 'HERBIVORE', name: `Herbivore ${i}` }))
    
    const plants = []
    for (let i = 0; i < 50; i++) plants.push(createMockPlant())

    const world = createMockWorld({ creatures, plants })
    const dtSec = 1 / 60

    expect(() => {
      for (let frame = 0; frame < 10000; frame++) {
        simulate(world, dtSec)
        
        // At interval, explicitly verify no NaNs are creeping into the positions
        if (frame % 1000 === 0) {
          for (const c of world.creatures) {
            expect(Number.isNaN(c.x)).toBe(false)
            expect(Number.isNaN(c.y)).toBe(false)
            expect(Number.isNaN(c.health)).toBe(false)
          }
        }
      }
    }).not.toThrow()

    // Ensure simulation actually progressed
    expect(world.totalTime).toBeCloseTo(10000 / 60)
  })
})
