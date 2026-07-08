import { describe, it, expect } from 'vitest'
import { calculateCreatureStats } from './creatureFactory'
import type { Decal } from '../types'

describe('calculateCreatureStats', () => {
  it('calculates base stats for a medium herbivore crawler', () => {
    const stats = calculateCreatureStats('MEDIUM', 'CRAWLER', 'HERBIVORE', [])
    expect(stats.speed).toBeGreaterThan(0)
    expect(stats.maxHealth).toBe(100) // BASE_HEALTH * 1
    expect(stats.sight).toBeGreaterThanOrEqual(250) // Matches SIGHT_RADIUS
    expect(stats.braveryBonus).toBe(0)
  })

  it('correctly stacks decal modifiers without exceeding hard caps', () => {
    const decals: Decal[] = [
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'CARNIVORE_EYE', type: 'EYE' },
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'CARNIVORE_EYE', type: 'EYE' },
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'CARNIVORE_EYE', type: 'EYE' },
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'CARNIVORE_EYE', type: 'EYE' },
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'CARNIVORE_EYE', type: 'EYE' }, // +0.75 sight multiplier, +0.5 bravery
    ]
    const stats = calculateCreatureStats('LARGE', 'CRAWLER', 'CARNIVORE', decals)
    
    // Sight radius should be capped at 800
    expect(stats.sight).toBeLessThanOrEqual(800)
    
    // Bravery bonus should be exactly 0.5
    expect(stats.braveryBonus).toBeCloseTo(0.5)
  })

  it('correctly calculates negative bravery for bug eyes', () => {
    const decals: Decal[] = [
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'INSECT_EYE', type: 'EYE' },
      { x: 0, y: 0, scale: 1, rotation: 0, style: 'INSECT_EYE', type: 'EYE' },
    ]
    const stats = calculateCreatureStats('SMALL', 'HOPPER', 'OMNIVORE', decals)
    
    // Sight multiplier is +0.6, bravery is -0.3 (clamped)
    expect(stats.sight).toBeGreaterThan(250)
    expect(stats.braveryBonus).toBeCloseTo(0.0) // because we clamp to min 0!
  })

  it('enforces maximum speed constraints even with multiple beaks', () => {
    const decals: Decal[] = Array(15).fill({ x: 0, y: 0, scale: 1, rotation: 0, style: 'BEAK' })
    const stats = calculateCreatureStats('MEDIUM', 'PACER', 'HERBIVORE', decals)
    
    // BASE_SPEED * 3 is the max cap for speed
    // BASE_SPEED is 150, so max is 450
    expect(stats.speed).toBeLessThanOrEqual(450)
  })
})
