import { DEPTH_SCALE_FAR, DEPTH_SCALE_NEAR } from '../constants'

/**
 * getDepthScale — returns the visual scale multiplier for an entity at world Y.
 */
export function getDepthScale(worldY: number, worldHeight: number): number {
  if (!Number.isFinite(worldY) || !Number.isFinite(worldHeight) || worldHeight <= 0) return 1.0;
  const t = Math.max(0, Math.min(1, worldY / worldHeight));
  return DEPTH_SCALE_FAR + (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR) * t;
}

export function getSpawnOffsetY(age: number): number {
  if (!Number.isFinite(age) || age < 0) return 0;
  if (age >= 0.4) return 0;
  
  const t = age / 0.4;
  const n1 = 7.5625;
  const d1 = 2.75;
  let bounce = 0;
  if (t < 1 / d1) {
    bounce = n1 * t * t;
  } else if (t < 2 / d1) {
    const t2 = t - 1.5 / d1;
    bounce = n1 * t2 * t2 + 0.75;
  } else if (t < 2.5 / d1) {
    const t2 = t - 2.25 / d1;
    bounce = n1 * t2 * t2 + 0.9375;
  } else {
    const t2 = t - 2.625 / d1;
    bounce = n1 * t2 * t2 + 0.984375;
  }
  return (1 - bounce) * 600;
}

export function getWobbleRotation(state: string, vx: number): number {
  if (!Number.isFinite(vx) || state !== 'MOVING') return 0;
  const wobbleDir = vx > 0 ? 1 : -1;
  return (5 * Math.PI / 180) * wobbleDir;
}

export function getSquashStretch(movement: string, state: string, hopPhase: number): { scaleX: number, scaleY: number } {
  if (movement === 'HOPPER' && state === 'JUMPING' && Number.isFinite(hopPhase)) {
    const phase = ((hopPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const ascending = phase < Math.PI / 2;
    return {
      scaleY: ascending ? 1.3 : 0.75,
      scaleX: ascending ? 0.85 : 1.2
    };
  }
  return { scaleX: 1, scaleY: 1 };
}

export function getBreatheScale(age: number): number {
  if (!Number.isFinite(age)) return 1;
  return 1 + Math.sin(age * Math.PI) * 0.025;
}

export function getBossAuraRadius(level: number, age: number, baseSize: number): number {
  if (!Number.isFinite(level) || !Number.isFinite(age) || !Number.isFinite(baseSize)) return 0;
  if (level < 5) return 0;
  const pulse = 0.5 + 0.5 * Math.sin(age * 3);
  return Math.max(0, baseSize * 0.6 + baseSize * 0.1 * pulse);
}

export function getProjectedY(worldY: number, z: number, cameraTilt: number, spawnOffsetY: number): number {
  if (!Number.isFinite(worldY) || !Number.isFinite(z) || !Number.isFinite(cameraTilt) || !Number.isFinite(spawnOffsetY)) return 0;
  return (worldY * cameraTilt) - z - spawnOffsetY;
}
