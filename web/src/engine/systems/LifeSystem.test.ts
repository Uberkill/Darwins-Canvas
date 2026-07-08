import { describe, it, expect } from 'vitest'
import { LifeSystem } from './LifeSystem'
import { buildCreature } from '../creatureFactory'
import type { WorldState } from '../../types'
import { vi } from 'vitest'

vi.mock('../audioEngine', () => ({
  audio: {
    playLevelUp: vi.fn(),
    playCreatureEvent: vi.fn()
  }
}))

describe('LifeSystem', () => {
  it('should drain hunger and age the creature', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'HERBIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    const initialHunger = c.hunger
    
    const world = {
      creatures: [c],
      worldWidth: 1000,
      worldHeight: 1000,
      timeOfDay: 0,
      scratchpad: { deletedCreatureIds: new Set() }
    } as unknown as WorldState

    LifeSystem.update(world, 1.0, 1.0)

    expect(c.age).toBe(1.0)
    expect(c.hunger).toBeLessThan(initialHunger)
  })

  it('should apply exhaustion speed penalties when stamina is 0 (handled by movement system, but LifeSystem drains it)', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'CARNIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    c.behavior = 'FORAGING'
    c.stamina = 10
    c.hunger = 50 // Prevent carnivore from falling asleep during the day
    
    const world = {
      creatures: [c],
      worldWidth: 1000,
      worldHeight: 1000,
      timeOfDay: 0,
    } as unknown as WorldState
    const initialStamina = c.stamina
    LifeSystem.update(world, 1.0, 1.0) // 1 second of stamina drain
    expect(c.stamina).toBeLessThan(initialStamina)
  })
})
