import { describe, it, expect } from 'vitest'
import { NavigationSystem } from './NavigationSystem'
import { buildCreature } from '../creatureFactory'
import type { WorldState } from '../../types'

describe('NavigationSystem', () => {
  it('should ignore dragged entities', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'HERBIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    c.id = 'dragged-1'
    c.direction.vx = 10
    c.direction.vy = 10

    const world = {
      creatures: [c],
      plants: [],
      draggedEntityId: 'dragged-1',
      worldWidth: 1000,
      worldHeight: 1000,
      timeOfDay: 0,
      scratchpad: { deletedCreatureIds: new Set(), deletedPlantIds: new Set() }
    } as unknown as WorldState

    NavigationSystem.update(world, 0.016, 1.0)

    expect(c.direction.vx).toBe(0)
    expect(c.direction.vy).toBe(0)
  })

  it('should apply wandering forces when no targets exist', () => {
    const c = buildCreature({ name: 'Test', size: 'MEDIUM', diet: 'HERBIVORE', movement: 'CRAWLER', drawingData: '', decals: [] }, 1000, 1000)
    c.direction.vx = 0
    c.direction.vy = 0

    const world = {
      creatures: [c],
      plants: [],
      draggedEntityId: null,
      worldWidth: 1000,
      worldHeight: 1000,
      timeOfDay: 0,
      scratchpad: { deletedCreatureIds: new Set(), deletedPlantIds: new Set() }
    } as unknown as WorldState

    NavigationSystem.update(world, 0.016, 1.0)

    // Should have not mutated vx/vy (fallback behavior relies on movement scripts)
    expect(c.direction.vx === 0 && c.direction.vy === 0).toBe(true)
    expect(c.behavior).toBe('WANDERING')
  })
})
