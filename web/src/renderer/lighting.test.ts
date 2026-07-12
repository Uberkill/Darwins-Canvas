import { describe, it, expect } from 'vitest';
import { getNightAlpha } from './lighting';

describe('lighting.ts - getNightAlpha', () => {
  it('returns 0 for undefined timeOfDay', () => {
    expect(getNightAlpha(undefined)).toBe(0);
  });

  it('returns 0 for full daylight (0.0 to 0.5)', () => {
    expect(getNightAlpha(0.0)).toBe(0);
    expect(getNightAlpha(0.25)).toBe(0);
    expect(getNightAlpha(0.49)).toBe(0);
  });

  it('ramps up correctly during dusk (0.5 to 0.6)', () => {
    expect(getNightAlpha(0.5)).toBeCloseTo(0);
    expect(getNightAlpha(0.55)).toBeCloseTo(0.3);
    expect(getNightAlpha(0.6)).toBeCloseTo(0.6);
  });

  it('returns 0.6 for full night (0.6 to 0.9)', () => {
    expect(getNightAlpha(0.7)).toBeCloseTo(0.6);
    expect(getNightAlpha(0.89)).toBeCloseTo(0.6);
  });

  it('ramps down correctly during dawn (0.9 to 1.0)', () => {
    expect(getNightAlpha(0.9)).toBeCloseTo(0.6);
    expect(getNightAlpha(0.95)).toBeCloseTo(0.3);
    expect(getNightAlpha(1.0)).toBeCloseTo(0); // wraps around
  });
});
