import { describe, it, expect, beforeEach } from 'vitest'
import { spawnCreature, spawnPlant, killCreature, flushDeadEntities, clearEntities } from './entityManager'
import type { WorldState, Creature, Plant } from '../types'

describe('entityManager', () => {
  let world: WorldState

  beforeEach(() => {
    world = {
      creatures: [],
      plants: [],
      visualEffects: [],
      worldWidth: 2000,
      worldHeight: 2000,
      totalTime: 0,
      timeOfDay: 0,
      plantSpawnTimer: 0,
      isPaused: false,
      weather: 'CLEAR',
      flags: { boundsChanged: false },
      scratchpad: {
        deletedCreatureIds: new Set(),
        deletedPlantIds: new Set()
      },
      camera: { x: 0, y: 0, zoom: 1 },
      draggedEntityId: null,
      hoveredEntityId: null,
      activeLure: null,
      analytics: {
        currentSecondAccumulator: {
          birthsCarn: 0, birthsOmni: 0, birthsHerb: 0,
          starvationCarn: 0, starvationOmni: 0, starvationHerb: 0,
          huntedCarn: 0, huntedOmni: 0, huntedHerb: 0,
          damageCarn: 0, damageOmni: 0, damageHerb: 0,
          caloriesCarn: 0, caloriesOmni: 0, caloriesHerb: 0,
        },
        history: []
      },
      historyTimer: 0,
      mouseX: 0,
      mouseY: 0
    }
  })

  it('safely spawns entities', () => {
    const mockCreature = { id: 'c1', x: 0, y: 0 } as Creature
    const mockPlant = { id: 'p1', x: 0, y: 0 } as Plant
    
    spawnCreature(world, mockCreature)
    spawnPlant(world, mockPlant)
    
    expect(world.creatures).toHaveLength(1)
    expect(world.plants).toHaveLength(1)
  })

  it('defers deletion until flush', () => {
    const mockCreature = { id: 'c1', x: 0, y: 0 } as Creature
    spawnCreature(world, mockCreature)
    
    killCreature(world, 'c1')
    
    // Array should not be mutated immediately
    expect(world.creatures).toHaveLength(1)
    expect(world.scratchpad.deletedCreatureIds.has('c1')).toBe(true)
    
    // Mutation happens on flush
    flushDeadEntities(world)
    expect(world.creatures).toHaveLength(0)
    expect(world.scratchpad.deletedCreatureIds.size).toBe(0)
  })

  it('clears all entities safely', () => {
    spawnCreature(world, { id: 'c1', x: 0, y: 0 } as Creature)
    world.draggedEntityId = 'c1'
    
    clearEntities(world)
    
    expect(world.creatures).toHaveLength(0)
    expect(world.draggedEntityId).toBeNull()
  })
})
