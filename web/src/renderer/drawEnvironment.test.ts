import { describe, it, expect, vi } from 'vitest';
import { drawEnvironment } from './drawEnvironment';
import type { WorldState } from '../types';

describe('drawEnvironment.ts', () => {
  it('does not throw errors for any weather or timeOfDay', () => {
    // Mock canvas context
    const mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const mockWorld: Partial<WorldState> = {
      worldWidth: 1000,
      worldHeight: 1000,
      totalTime: 10,
    };

    // Test CLEAR
    expect(() => drawEnvironment(mockCtx, { ...mockWorld, weather: 'CLEAR', timeOfDay: 0.5 } as WorldState)).not.toThrow();

    // Test RAIN
    expect(() => drawEnvironment(mockCtx, { ...mockWorld, weather: 'RAIN', timeOfDay: undefined as any } as WorldState)).not.toThrow();

    // Test DROUGHT
    expect(() => drawEnvironment(mockCtx, { ...mockWorld, weather: 'DROUGHT', timeOfDay: 0.9 } as WorldState)).not.toThrow();
  });
});
