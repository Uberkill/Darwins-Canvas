import { describe, it, expect } from 'vitest'
import { EnvironmentSystem } from './EnvironmentSystem'
import { createMockWorld } from '../../test/factories'
import { NIGHT_SIGHT_PENALTY, DAY_NIGHT_CYCLE_DURATION, WEATHER_CYCLE_DURATION } from '../../constants'

describe('EnvironmentSystem — Sight Penalty', () => {
  it('daytime (timeOfDay=0.3): penalty = 1.0, no reduction', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.3
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    expect(penalty).toBe(1.0)
  })

  it('exact dusk start (timeOfDay=0.5): t=0, penalty = 1.0 (no reduction yet)', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.5
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    expect(penalty).toBeCloseTo(1.0, 5)
  })

  it('mid dusk (timeOfDay=0.55): penalty is between full and none', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.55
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    const fullNight = 1.0 - NIGHT_SIGHT_PENALTY
    expect(penalty).toBeGreaterThan(fullNight)
    expect(penalty).toBeLessThan(1.0)
  })

  it('exact dusk end (timeOfDay=0.6): t=1, full night penalty applied', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.6
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    // t = (0.6 - 0.5) / 0.1 = 1.0 → full penalty
    expect(penalty).toBeCloseTo(1.0 - NIGHT_SIGHT_PENALTY, 5)
  })

  it('deep night (timeOfDay=0.75): penalty = 1.0 - NIGHT_SIGHT_PENALTY', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.75
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    expect(penalty).toBeCloseTo(1.0 - NIGHT_SIGHT_PENALTY, 5)
  })

  it('dawn start (timeOfDay=0.9): still at full night penalty (t=0)', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.9
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    // t = (0.9 - 0.9) / 0.1 = 0 → still full night penalty
    expect(penalty).toBeCloseTo(1.0 - NIGHT_SIGHT_PENALTY, 5)
  })

  it('dawn end (timeOfDay=1.0): penalty ramps back to 1.0', () => {
    const world = createMockWorld()
    world.timeOfDay = 1.0
    world.totalTime = 0
    const penalty = EnvironmentSystem.update(world, 0)
    // t = (1.0 - 0.9) / 0.1 = 1.0 → full recovery
    expect(penalty).toBeCloseTo(1.0, 5)
  })

  it('timeOfDay advances by dt / DAY_NIGHT_CYCLE_DURATION each tick', () => {
    const world = createMockWorld()
    world.timeOfDay = 0.0
    world.totalTime = 0
    const dt = 10
    EnvironmentSystem.update(world, dt)
    expect(world.timeOfDay).toBeCloseTo(dt / DAY_NIGHT_CYCLE_DURATION, 5)
  })
})

describe('EnvironmentSystem — Weather', () => {
  it('sets CLEAR weather in first half of cycle', () => {
    const world = createMockWorld()
    world.totalTime = 0 // phase = 0 → CLEAR
    world.timeOfDay = 0
    EnvironmentSystem.update(world, 0)
    expect(world.weather).toBe('CLEAR')
  })

  it('sets RAIN weather when phase is between 1.0 and 1.5', () => {
    const world = createMockWorld()
    // phase = (totalTime % (WEATHER_CYCLE_DURATION*2)) / WEATHER_CYCLE_DURATION
    // We need phase ∈ [1.0, 1.5). Set totalTime = WEATHER_CYCLE_DURATION * 1.2
    world.totalTime = WEATHER_CYCLE_DURATION * 1.2
    world.timeOfDay = 0
    EnvironmentSystem.update(world, 0)
    expect(world.weather).toBe('RAIN')
  })

  it('sets DROUGHT weather when phase >= 1.5', () => {
    const world = createMockWorld()
    world.totalTime = WEATHER_CYCLE_DURATION * 1.8
    world.timeOfDay = 0
    EnvironmentSystem.update(world, 0)
    expect(world.weather).toBe('DROUGHT')
  })
})
