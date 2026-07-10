let _randomFn = Math.random;

/** 
 * Replaces the PRNG for deterministic testing.
 * Do not call in production.
 */
export function setRandomFn(fn: () => number) {
  _randomFn = fn;
}

/**
 * Game engine specific random function.
 * Use this instead of Math.random() for physics determinism.
 */
export function random(): number {
  return _randomFn();
}
