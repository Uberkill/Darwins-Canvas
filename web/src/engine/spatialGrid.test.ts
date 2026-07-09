import { describe, it, expect } from 'vitest'
import { SpatialGrid } from './SpatialGrid'
import type { Creature, Plant } from '../types'

describe('SpatialGrid', () => {
  it('initializes correct number of cells', () => {
    // 1000x1000 world with 100px cells = 10x10 = 100 cells
    const grid = new SpatialGrid(1000, 1000, 100)
    expect(grid.cols).toBe(10)
    expect(grid.rows).toBe(10)
    expect(grid.creatureCells.length).toBe(100)
  })

  it('inserts and retrieves entities locally', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const c1 = { id: '1', x: 50, y: 50 } as Creature // Cell [0,0]
    const c2 = { id: '2', x: 150, y: 50 } as Creature // Cell [1,0]
    const c3 = { id: '3', x: 900, y: 900 } as Creature // Cell [9,9] - far away

    grid.insertCreature(c1)
    grid.insertCreature(c2)
    grid.insertCreature(c3)

    const results: Creature[] = []
    
    // Search around [50, 50] with 49 radius (x=99, strictly cell 0,0)
    grid.getNearbyCreatures(50, 50, 49, results)
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('1')

    // Search around [50, 50] with 120 radius (covers cells 0,0 and 1,0)
    grid.getNearbyCreatures(50, 50, 120, results)
    expect(results).toHaveLength(2)
    expect(results.some(c => c.id === '1')).toBe(true)
    expect(results.some(c => c.id === '2')).toBe(true)
    expect(results.some(c => c.id === '3')).toBe(false)
  })

  it('clears entities properly without allocating new arrays', () => {
    const grid = new SpatialGrid(1000, 1000, 100)
    const originalRef = grid.creatureCells[0]
    
    grid.insertCreature({ id: '1', x: 50, y: 50 } as Creature)
    expect(grid.creatureCells[0]).toHaveLength(1)

    grid.clear()
    
    expect(grid.creatureCells[0]).toHaveLength(0)
    // Ensure memory reference is the exact same (zero allocation)
    expect(grid.creatureCells[0]).toBe(originalRef)
  })

  it('resizes dynamically if map size grows', () => {
    const grid = new SpatialGrid(100, 100, 100) // 1x1 grid
    expect(grid.creatureCells).toHaveLength(1)

    grid.resize(300, 100) // Now 3x1 grid
    expect(grid.cols).toBe(3)
    expect(grid.creatureCells).toHaveLength(3)
  })
})
