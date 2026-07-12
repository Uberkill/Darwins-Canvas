import { describe, it, expect, beforeEach } from 'vitest';
import { simulate } from './simulate';
import type { WorldState, Creature } from '../types';

describe('Terrain Physics & Modifiers', () => {
  let world: WorldState;
  
  beforeEach(() => {
    // Basic world setup
    world = {
      worldWidth: 1000,
      worldHeight: 1000,
      timeOfDay: 0.5,
      weather: 'CLEAR',
      totalTime: 0,
      creatures: [],
      plants: [],
      visualEffects: [],
      analytics: {
        populationHistory: [],
        currentSecondAccumulator: { 
          birthsCarn: 0, birthsHerb: 0, birthsOmni: 0, 
          starvationCarn: 0, starvationHerb: 0, starvationOmni: 0,
          huntedCarn: 0, huntedHerb: 0, huntedOmni: 0,
          damageCarn: 0, damageHerb: 0, damageOmni: 0,
          caloriesCarn: 0, caloriesHerb: 0, caloriesOmni: 0
        }
      },
      flags: { boundsChanged: false, terrainChanged: false },
      scratchpad: {
        spatialGrid: null as any,
        deletedCreatureIds: new Set(),
        deletedPlantIds: new Set(),
        terrain: new Uint8Array(100),
        terrainWidth: 10,
        terrainHeight: 10
      },
      camera: { x: 0, y: 0, zoom: 1 },
      draggedEntityId: null,
      plantSpawnTimer: 0
    } as unknown as WorldState;
  });

  it('Crawlers should take drowning damage and panic in Water', () => {
    // Fill terrain with WATER
    world.scratchpad.terrain!.fill(0);
    
    const crawler: Creature = {
      id: 'c1',
      x: 150, y: 150,
      movement: 'CRAWLER',
      health: 100, maxHealth: 100,
      stamina: 100, maxStamina: 100,
      panicTimer: 0,
      behavior: 'WANDERING',
      diet: 'HERBIVORE',
      baseStats: { speed: 100, sightRadius: 100, maxHealth: 100, renderScale: 1, damage: 10 },
      direction: { vx: 1, vy: 0 },
      speed: 100,
      currentScale: 1,
      renderScale: 1,
      age: 0, maxAge: 100,
      hunger: 80, hungerDrainRate: 1, baseDrainRate: 1,
      foodEaten: 0, kills: 0, level: 1
    } as any;
    world.creatures.push(crawler);
    
    // Simulate 1 second
    simulate(world, 1.0);
    
    // Drowning damage is 5 DPS
    expect(crawler.health).toBeLessThan(100);
    // Panic timer should be active
    expect(crawler.panicTimer).toBeGreaterThan(0);
  });

  it('Hoppers should ignore water drowning because they jump', () => {
    // Fill terrain with WATER
    world.scratchpad.terrain!.fill(0);
    
    const hopper: Creature = {
      id: 'h1',
      x: 150, y: 150,
      movement: 'HOPPER',
      health: 100, maxHealth: 100,
      stamina: 100, maxStamina: 100,
      panicTimer: 0,
      behavior: 'WANDERING',
      diet: 'HERBIVORE',
      baseStats: { speed: 100, sightRadius: 100, maxHealth: 100, renderScale: 1, damage: 10 },
      direction: { vx: 1, vy: 0 },
      speed: 100,
      currentScale: 1,
      renderScale: 1,
      age: 0, maxAge: 100,
      hunger: 80, hungerDrainRate: 1, baseDrainRate: 1,
      foodEaten: 0, kills: 0, level: 1
    } as any;
    world.creatures.push(hopper);
    
    simulate(world, 1.0);
    
    // Hopper should take NO drowning damage
    expect(hopper.health).toBe(100);
    // Hopper should not panic
    expect(hopper.panicTimer).toBe(0);
  });

  it('Crawlers should suffer speed penalties on rocks', () => {
    // Fill terrain with ROCK (3)
    world.scratchpad.terrain!.fill(3);
    
    const crawler: Creature = {
      id: 'c1',
      x: 150, y: 150,
      movement: 'CRAWLER',
      health: 100, maxHealth: 100,
      stamina: 100, maxStamina: 100,
      panicTimer: 0,
      behavior: 'WANDERING',
      diet: 'HERBIVORE',
      baseStats: { speed: 100, sightRadius: 100, maxHealth: 100, renderScale: 1, damage: 10 },
      direction: { vx: 1, vy: 0 }, // Move right
      speed: 100,
      currentScale: 1,
      renderScale: 1,
      age: 0, maxAge: 100,
      hunger: 80, hungerDrainRate: 1, baseDrainRate: 1,
      foodEaten: 0, kills: 0, level: 1
    } as any;
    world.creatures.push(crawler);
    
    // Simulate 1 second
    simulate(world, 1.0);
    
    // Base speed is 100. Expected distance without rock: 100
    // With 30% slow on rocks, plus random AI wandering steering noise, it should be significantly less than 250
    // Crawler X should definitely be less than 240
    expect(crawler.x).toBeLessThan(240);
  });
});
