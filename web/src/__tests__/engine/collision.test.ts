// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { runCollision } from '../../engine/collision'
import type { WorldState, Creature, Plant } from '../../types'
import { CARNIVORE_EAT_RANGE } from '../../constants'

function makeWorld(overrides: Partial<WorldState> = {}): WorldState {
  return {
    creatures: [],
    plants: [],
    plantSpawnTimer: 3,
    herbivoreSpawnTimer: 10,
    totalTime: 0,
    worldWidth: 1000,
    worldHeight: 800,
    mouseX: -1000,
    mouseY: -1000,
    hoveredEntityId: null,
    activeLure: null,
    timeOfDay: 0.5,
    flags: { boundsChanged: false },
    scratchpad: {
      deletedCreatureIds: new Set<string>(),
      deletedPlantIds: new Set<string>(),
    },
    ...overrides,
  }
}

function makeCreature(overrides: Partial<Creature>): Creature {
  return {
    id: crypto.randomUUID(),
    name: 'Test',
    drawingData: '',
    x: 500, y: 500, z: 0,
    size: 'MEDIUM', movement: 'CRAWLER', diet: 'HERBIVORE',
    speed: 80, hungerDrainRate: 4, renderScale: 1, sightRadius: 250, targetId: null,
    hunger: 80, direction: { vx: 1, vy: 0 }, state: 'IDLE', behavior: 'WANDERING', age: 0, stamina: 100,
    maxStamina: 100, lungeTimer: 0, lungeCooldownTimer: 0, maxAge: 300, generation: 1, currentScale: 1.0,
    health: 100, maxHealth: 100, damage: 10,
    hopPhase: 0, hopPauseTimer: 0,
    pacerMoveTimer: 1.5, pacerPauseTimer: 0, pacerPaused: false,
    reproductionCooldown: 0,
    ...overrides,
  }
}

function makePlant(x: number, y: number): Plant {
  return { id: crypto.randomUUID(), x, y, growthStage: 1, wobblePhase: 0 }
}

describe('runCollision', () => {
  it('triggers combat when predators catch prey', () => {
    const carnivore = makeCreature({ diet: 'CARNIVORE', x: 500, y: 500, damage: 20 })
    const herbivore = makeCreature({ diet: 'HERBIVORE', x: 500 + CARNIVORE_EAT_RANGE - 5, y: 500, damage: 5 })
    const world = makeWorld({ creatures: [carnivore, herbivore] })
    runCollision(world, 1.0)
    
    expect(carnivore.state).toBe('FIGHTING')
    expect(herbivore.state).toBe('FIGHTING')
    
    // Check damage was dealt (dt = 1.0)
    expect(carnivore.health).toBe(95)
    expect(herbivore.health).toBe(80)
  })

  it('deletes creature when health drops below 0 during combat', () => {
    const carnivore = makeCreature({ diet: 'CARNIVORE', x: 500, y: 500, damage: 100 })
    const herbivore = makeCreature({ diet: 'HERBIVORE', x: 500, y: 500, health: 50 })
    const world = makeWorld({ creatures: [carnivore, herbivore] })
    
    runCollision(world, 1.0)
    
    expect(world.scratchpad.deletedCreatureIds.has(herbivore.id)).toBe(true)
    expect(carnivore.hunger).toBe(100) // winner heals hunger
  })

  it('does NOT eat hopper when hopper is airborne (Z difference > 30)', () => {
    const carnivore = makeCreature({ diet: 'CARNIVORE', x: 500, y: 500, z: 0 })
    const hopper = makeCreature({ diet: 'HERBIVORE', movement: 'HOPPER', x: 510, y: 500, z: 35 })
    const world = makeWorld({ creatures: [carnivore, hopper] })
    runCollision(world, 1.0)
    
    expect(carnivore.state).not.toBe('FIGHTING')
    expect(hopper.state).not.toBe('FIGHTING')
  })

  it('herbivore eats plant instantly', () => {
    const herbivore = makeCreature({ diet: 'HERBIVORE', x: 500, y: 500, hunger: 50 })
    const plant = makePlant(510, 500)
    const world = makeWorld({ creatures: [herbivore], plants: [plant] })
    
    runCollision(world, 1.0)
    
    expect(world.scratchpad.deletedPlantIds.has(plant.id)).toBe(true)
    expect(herbivore.hunger).toBe(100)
    expect(herbivore.state).toBe('EATING')
  })
})
