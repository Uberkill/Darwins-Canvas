import { describe, it, expect } from 'vitest'
import { SpatialGrid } from './SpatialGrid'
import type { Creature, Plant } from '../types'

describe('SpatialGrid', () => {
  it('initializes correct number of cells', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    expect(grid.cols).toBe(10)
    expect(grid.rows).toBe(10)
    expect(grid.creatureCells.length).toBe(100)
  })

  it('inserts and retrieves entities locally', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const c1 = { id: '1', x: 50, y: 50 } as Creature
    const c2 = { id: '2', x: 150, y: 50 } as Creature
    const c3 = { id: '3', x: 900, y: 900 } as Creature

    grid.insertCreature(c1)
    grid.insertCreature(c2)
    grid.insertCreature(c3)

    const results: Creature[] = []
    grid.getNearbyCreatures(50, 50, 49, results)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1')

    grid.getNearbyCreatures(50, 50, 120, results)
    expect(results).toHaveLength(2)
    expect(results.some(c => c.id === '3')).toBe(false)
  })

  it('clears entities without allocating new arrays', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const originalRef = grid.creatureCells[0]
    grid.insertCreature({ id: '1', x: 50, y: 50 } as Creature)
    expect(grid.creatureCells[0]).toHaveLength(1)
    grid.clear()
    expect(grid.creatureCells[0]).toHaveLength(0)
    expect(grid.creatureCells[0]).toBe(originalRef) // same reference, no GC pressure
  })

  it('resizes dynamically', () => {
    const grid = new SpatialGrid(100, 100, 100)
    expect(grid.creatureCells).toHaveLength(1)
    grid.resize(300, 100)
    expect(grid.cols).toBe(3)
    expect(grid.creatureCells).toHaveLength(3)
  })

  it('insertPlant + getNearbyPlants retrieves the correct plant', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const p1 = { id: 'plant-1', x: 50, y: 50 } as Plant
    const p2 = { id: 'plant-2', x: 900, y: 900 } as Plant

    grid.insertPlant(p1)
    grid.insertPlant(p2)

    const results: Plant[] = []
    grid.getNearbyPlants(50, 50, 49, results)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('plant-1')
  })

  it('getNearbyPlants does not return distant plants', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const nearby = { id: 'near', x: 200, y: 200 } as Plant
    const far = { id: 'far', x: 800, y: 800 } as Plant
    grid.insertPlant(nearby)
    grid.insertPlant(far)

    const results: Plant[] = []
    grid.getNearbyPlants(200, 200, 50, results)
    expect(results.some(p => p.id === 'far')).toBe(false)
  })

  it('getCellIndex NaN input: clamps to 0 without crash', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    // Inserting a creature with NaN coordinates should not throw
    expect(() => {
      grid.insertCreature({ id: 'nan', x: NaN, y: NaN } as Creature)
    }).not.toThrow()
    // Should be in cell 0
    expect(grid.creatureCells[0]).toHaveLength(1)
  })
})
