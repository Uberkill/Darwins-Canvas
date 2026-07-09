import { describe, it, expect } from 'vitest'
import { NavigationSystem } from './NavigationSystem'
import { createMockWorld, createMockCreature } from '../../test/factories'
import { SpatialGrid } from '../SpatialGrid'

describe('NavigationSystem', () => {
  it('should ignore dragged entities', () => {
    const c = createMockCreature({ x: 100, y: 100 })
    c.id = 'dragged-1'
    c.direction.vx = 10
    c.direction.vy = 10

    const world = createMockWorld({ creatures: [c] })
    world.draggedEntityId = 'dragged-1'
    world.scratchpad.spatialGrid = new SpatialGrid(1000, 1000, 150)
    world.scratchpad.spatialGrid.insertCreature(c)

    NavigationSystem.update(world, 0.016, 1.0)

    expect(c.direction.vx).toBe(0)
    expect(c.direction.vy).toBe(0)
  })

  it('should apply wandering forces when no targets exist', () => {
    const c = createMockCreature({ x: 100, y: 100, behavior: 'IDLE' })
    const world = createMockWorld({ creatures: [c] })
    world.scratchpad.spatialGrid = new SpatialGrid(1000, 1000, 150)
    world.scratchpad.spatialGrid.insertCreature(c)

    c.direction.vx = 0
    c.direction.vy = 0

    NavigationSystem.update(world, 0.016, 1.0)

    expect(c.direction.vx === 0 && c.direction.vy === 0).toBe(true)
    expect(c.behavior).toBe('WANDERING')
  })
})
