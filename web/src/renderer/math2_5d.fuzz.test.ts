import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { 
  getDepthScale, 
  getSpawnOffsetY, 
  getWobbleRotation, 
  getSquashStretch, 
  getBreatheScale, 
  getBossAuraRadius,
  getProjectedY
} from './math2_5d';

describe('math2_5d property-based testing (Fuzzing)', () => {

  it('getDepthScale never returns NaN', () => {
    fc.assert(
      fc.property(fc.float(), fc.float(), (y, h) => {
        const scale = getDepthScale(y, h);
        expect(Number.isNaN(scale)).toBe(false);
      })
    );
  });

  it('getSpawnOffsetY never returns NaN', () => {
    fc.assert(
      fc.property(fc.float(), (age) => {
        const offset = getSpawnOffsetY(age);
        expect(Number.isNaN(offset)).toBe(false);
      })
    );
  });

  it('getWobbleRotation never returns NaN', () => {
    fc.assert(
      fc.property(fc.string(), fc.float(), (state, vx) => {
        const rot = getWobbleRotation(state, vx);
        expect(Number.isNaN(rot)).toBe(false);
      })
    );
  });

  it('getSquashStretch never returns NaN', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.float(), (movement, state, hopPhase) => {
        const { scaleX, scaleY } = getSquashStretch(movement, state, hopPhase);
        expect(Number.isNaN(scaleX)).toBe(false);
        expect(Number.isNaN(scaleY)).toBe(false);
      })
    );
  });

  it('getBreatheScale never returns NaN', () => {
    fc.assert(
      fc.property(fc.float(), (age) => {
        const s = getBreatheScale(age);
        expect(Number.isNaN(s)).toBe(false);
      })
    );
  });

  it('getBossAuraRadius never returns NaN or negative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.float(), fc.float(), (level, age, size) => {
        const r = getBossAuraRadius(level, age, size);
        expect(Number.isNaN(r)).toBe(false);
        expect(r).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it('getProjectedY never returns NaN', () => {
    fc.assert(
      fc.property(fc.float(), fc.float(), fc.float(), fc.float(), (y, z, tilt, offset) => {
        const py = getProjectedY(y, z, tilt, offset);
        expect(Number.isNaN(py)).toBe(false);
      })
    );
  });
});
