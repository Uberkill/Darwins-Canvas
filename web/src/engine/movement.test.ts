import { describe, it, expect } from 'vitest';
import { moveCrawler, moveHopper } from './movement';
import { createMockCreature } from '../test/factories';
import { BASE_RENDER_SIZE } from '../constants';

// Since movement.ts is not exporting applyWallBounds natively, we might need to test it implicitly through crawler/hopper.
// Let's test the boundary conditions implicitly.

describe('movement.ts - Physics Edge Cases', () => {
  const W = 1000;
  const H = 1000;
  
  describe('Crawler Movement', () => {
    it('moves according to speed and direction', () => {
      const c = createMockCreature({ x: 500, y: 500 });
      c.speed = 100;
      c.direction = { vx: 1, vy: 0 }; // Moving right
      
      moveCrawler(c, 0.1, W, H);
      expect(c.x).toBe(510);
      expect(c.y).toBe(500);
      expect(c.state).toBe('MOVING');
    });

    it('bounces off the right wall (x > W)', () => {
      const c = createMockCreature({ x: W - 1, y: 500, renderScale: 1, currentScale: 1 });
      c.speed = 100;
      c.direction = { vx: 1, vy: 0 };
      
      const trueRadius = BASE_RENDER_SIZE / 2; // 25
      
      moveCrawler(c, 0.5, W, H);
      
      // Should clamp to W - trueRadius
      expect(c.x).toBe(W - trueRadius);
      expect(c.direction.vx).toBeLessThan(0); // bounced left
    });

    it('bounces off the top wall (y < 0)', () => {
      const c = createMockCreature({ x: 500, y: 1, renderScale: 1, currentScale: 1 });
      c.speed = 100;
      c.direction = { vx: 0, vy: -1 };
      
      const trueRadius = BASE_RENDER_SIZE / 2;
      
      moveCrawler(c, 0.5, W, H);
      expect(c.y).toBe(trueRadius);
      expect(c.direction.vy).toBeGreaterThan(0); // bounced down
    });
  });

  describe('Hopper Movement', () => {
    it('applies Z-axis elevation (sine wave) when hopping', () => {
      const c = createMockCreature({ x: 500, y: 500, movement: 'HOPPER' });
      c.hopPhase = 0;
      c.speed = 100;
      c.direction = { vx: 1, vy: 0 };
      
      // Move a little bit, hopPhase increases
      moveHopper(c, 0.1, W, H);
      
      expect(c.z).toBeGreaterThan(0);
      expect(c.state).toBe('JUMPING'); // Z goes over 5 fast
      
      // Move more, Z gets large enough to jump
      moveHopper(c, 0.5, W, H);
      expect(c.z).toBeGreaterThan(5);
      expect(c.state).toBe('JUMPING');
    });

    it('pauses movement between hops', () => {
      const c = createMockCreature({ x: 500, y: 500, movement: 'HOPPER' });
      c.hopPhase = 0;
      c.speed = 100;
      c.direction = { vx: 1, vy: 0 };
      c.hopPauseTimer = 1.0; // In pause state
      
      moveHopper(c, 0.1, W, H);
      
      expect(c.hopPauseTimer).toBeCloseTo(0.9);
      expect(c.x).toBe(500); // Did not move
      expect(c.z).toBe(0); // Snapped to ground
      expect(c.state).toBe('IDLE');
    });

    it('triggers pause at the end of a hop cycle', () => {
      const c = createMockCreature({ x: 500, y: 500, movement: 'HOPPER' });
      c.hopPhase = Math.PI - 0.01; // Almost finished hop
      c.speed = 100;
      c.direction = { vx: 1, vy: 0 };
      
      moveHopper(c, 0.1, W, H); // This step pushes it over Math.PI
      
      expect(c.hopPhase).toBe(0);
      expect(c.hopPauseTimer).toBeGreaterThan(0); // Pause triggered
    });
  });
});
