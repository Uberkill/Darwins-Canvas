// @ts-nocheck
import { describe, it, expect } from 'vitest'
import { moveCrawler, moveHopper, movePacer } from '../../engine/movement'
import type { Creature } from '../../types'
import { HOP_PAUSE_DURATION, PACER_MOVE_DURATION, PACER_PAUSE_DURATION } from '../../constants'

const WORLD_WIDTH = 1000
const WORLD_HEIGHT = 800

function makeCreature(overrides: Partial<Creature> = {}): Creature {
  return {
    id: 'test-id',
    name: 'Test',
    drawingData: '',
    x: 500,
    y: 400,
    z: 0,
    size: 'MEDIUM',
    movement: 'CRAWLER',
    diet: 'HERBIVORE',
    speed: 80,
    hungerDrainRate: 4,
    renderScale: 1,
    sightRadius: 250,
    hunger: 80,
    direction: { vx: 1, vy: 0 },
    state: 'IDLE',
    behavior: 'WANDERING',
    targetId: null,
    age: 0,
    stamina: 100,
    maxStamina: 100,
    lungeTimer: 0,
    lungeCooldownTimer: 0,
    maxAge: 300,
    generation: 1,
    currentScale: 1.0,
    health: 100,
    maxHealth: 100,
    damage: 10,
    hopPhase: 0,
    hopPauseTimer: 0,
    pacerMoveTimer: PACER_MOVE_DURATION,
    pacerPauseTimer: 0,
    pacerPaused: false,
    reproductionCooldown: 0,
    ...overrides,
  }
}

// ─── CRAWLER ─────────────────────────────────────────────────────────────────
describe('moveCrawler', () => {
  it('moves creature in 2D direction by speed * dt', () => {
    const c = makeCreature({ x: 500, y: 500, direction: { vx: 1, vy: 1 }, speed: 80 })
    moveCrawler(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.x).toBeCloseTo(500 + 80 * 0.016, 3)
    expect(c.y).toBeCloseTo(500 + 80 * 0.016, 3)
  })

  it('flips direction and clamps when hitting left wall', () => {
    const c = makeCreature({ x: 30, direction: { vx: -1, vy: 0 }, speed: 200 })
    moveCrawler(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT) 
    expect(c.x).toBe(40)
    expect(c.direction.vx).toBe(1)
  })

  it('flips direction and clamps when hitting bottom wall', () => {
    const c = makeCreature({ y: WORLD_HEIGHT - 30, direction: { vx: 0, vy: 1 }, speed: 200 })
    moveCrawler(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.y).toBe(WORLD_HEIGHT - 40)
    expect(c.direction.vy).toBe(-1)
  })
})

// ─── HOPPER ──────────────────────────────────────────────────────────────────
describe('moveHopper', () => {
  it('advances hop phase and updates Z elevation without altering Y logical position', () => {
    const c = makeCreature({ x: 500, y: 500, z: 0, direction: { vx: 1, vy: 0 }, speed: 80, movement: 'HOPPER' })
    moveHopper(c, 0.1, WORLD_WIDTH, WORLD_HEIGHT) // large dt to ensure z > 5
    expect(c.x).toBeCloseTo(500 + 80 * 0.1, 3)
    expect(c.y).toBe(500) // Y doesn't change since vy=0
    expect(c.z).toBeGreaterThan(5) // Z goes up
    expect(c.state).toBe('JUMPING')
  })

  it('pauses between hops and resets Z to 0', () => {
    const c = makeCreature({ movement: 'HOPPER', hopPhase: Math.PI + 0.1 })
    // Push it over the edge
    moveHopper(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.hopPauseTimer).toBe(HOP_PAUSE_DURATION)
    
    const xBefore = c.x
    // Now it should pause
    moveHopper(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.x).toBe(xBefore) // didn't move
    expect(c.z).toBe(0) // grounded
    expect(c.state).toBe('IDLE')
  })
})

// ─── PACER ───────────────────────────────────────────────────────────────────
describe('movePacer', () => {
  it('moves straight during burst phase', () => {
    const c = makeCreature({ movement: 'PACER', direction: { vx: -1, vy: -1 }, speed: 100 })
    movePacer(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.x).toBeCloseTo(500 - 100 * 0.016, 3)
    expect(c.y).toBeCloseTo(400 - 100 * 0.016, 3)
  })

  it('enters pause phase when move timer runs out', () => {
    const c = makeCreature({ movement: 'PACER', pacerMoveTimer: 0.01 })
    movePacer(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.pacerPaused).toBe(true)
    expect(c.pacerPauseTimer).toBe(PACER_PAUSE_DURATION)
  })

  it('picks random 2D direction after pause', () => {
    const c = makeCreature({ 
      movement: 'PACER', 
      pacerPaused: true, 
      pacerPauseTimer: 0.01,
      direction: { vx: 0, vy: 0 } 
    })
    movePacer(c, 0.016, WORLD_WIDTH, WORLD_HEIGHT)
    expect(c.pacerPaused).toBe(false)
    expect(c.pacerMoveTimer).toBe(PACER_MOVE_DURATION)
    expect(c.direction.vx).not.toBe(0) // should be set to new vector
  })
})
