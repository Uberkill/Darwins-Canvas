import { describe, it, expect, vi, beforeEach } from 'vitest';
import { worldRef, updateWorldDimensions, setWorldDimensions, centerCamera, getAutoFitZoom, clampEntitiesToWorld, initializeTerrain } from './worldRef';

vi.mock('./random', () => ({
  random: () => 0.5
}));

vi.mock('../constants', async () => {
  const actual = await vi.importActual('../constants');
  return {
    ...actual,
    getWorldWidth: () => 1000,
    getWorldHeight: () => 1000,
    BASE_RENDER_SIZE: 10,
    CAMERA_TILT: 0.5,
  };
});

describe('worldRef', () => {
  beforeEach(() => {
    // Reset state before each test
    worldRef.current.creatures = [];
    worldRef.current.plants = [];
    worldRef.current.worldWidth = 1000;
    worldRef.current.worldHeight = 1000;
    worldRef.current.mapSizeMultiplier = 1;
    worldRef.current.camera = { x: 500, y: 120, zoom: 1.0 };
    worldRef.current.draggedEntityId = null;
    worldRef.current.scratchpad.terrain = new Uint8Array();
    worldRef.current.scratchpad.terrainWidth = 0;
    worldRef.current.scratchpad.terrainHeight = 0;
  });

  it('updateWorldDimensions', () => {
    worldRef.current.mapSizeMultiplier = 2;
    updateWorldDimensions();
    expect(worldRef.current.worldWidth).toBe(2000);
    expect(worldRef.current.worldHeight).toBe(2000);
    expect(worldRef.current.flags.boundsChanged).toBe(true);
    expect(worldRef.current.flags.terrainChanged).toBe(true);
  });

  it('setWorldDimensions', () => {
    setWorldDimensions(3000, 3000);
    expect(worldRef.current.worldWidth).toBe(3000);
    expect(worldRef.current.worldHeight).toBe(3000);
    expect(worldRef.current.flags.boundsChanged).toBe(true);
    expect(worldRef.current.flags.terrainChanged).toBe(true);
  });

  it('centerCamera', () => {
    worldRef.current.worldWidth = 2000;
    worldRef.current.worldHeight = 2000;
    centerCamera();
    expect(worldRef.current.camera.x).toBe(1000);
    expect(worldRef.current.camera.y).toBe(500); // 1000 * 0.5 (CAMERA_TILT)
  });

  it('getAutoFitZoom in headless environment (returns 1.0)', () => {
    // We are running in Node/JSDOM where innerWidth is typical, 
    // let's mock window to simulate browser dimensions
    const originalWindow = globalThis.window;
    // @ts-ignore
    globalThis.window = { innerWidth: 500, innerHeight: 500 };
    worldRef.current.worldWidth = 1000;
    worldRef.current.worldHeight = 1000;
    const zoom = getAutoFitZoom();
    expect(zoom).toBe(1.0); // 500/1000 = 0.5, 500/500 = 1.0. Max is 1.0
    globalThis.window = originalWindow;
  });

  it('clampEntitiesToWorld clamps creature out of bounds', () => {
    worldRef.current.worldWidth = 100;
    worldRef.current.worldHeight = 100;
    const c = { id: 'c1', x: -50, y: 150, renderScale: 1, currentScale: 1 } as any;
    worldRef.current.creatures.push(c);
    
    clampEntitiesToWorld(worldRef.current);
    
    // radius = (10 * 1 * 1)/2 = 5
    // x < 5 => x = 5 + 0.5*20 = 15
    // y > 95 => y = 95 - 0.5*20 = 85
    expect(c.x).toBe(15);
    expect(c.y).toBe(85);
  });

  it('initializeTerrain sets up new array if missing', () => {
    worldRef.current.worldWidth = 200; // 2 cells
    worldRef.current.worldHeight = 200; // 2 cells
    initializeTerrain(worldRef.current);
    
    expect(worldRef.current.scratchpad.terrain).toBeInstanceOf(Uint8Array);
    expect(worldRef.current.scratchpad.terrain!.length).toBe(4);
    expect(worldRef.current.scratchpad.terrainWidth).toBe(2);
    expect(worldRef.current.scratchpad.terrainHeight).toBe(2);
  });
});
