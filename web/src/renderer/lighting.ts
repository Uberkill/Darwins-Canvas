/**
 * lighting.ts — Pure functions for calculating environment lighting.
 */

/**
 * Calculates the opacity of the night overlay based on the current time of day.
 * 
 * timeOfDay cycle:
 * 0.0 - 0.5: Full daylight (alpha = 0)
 * 0.5 - 0.6: Dusk transition (alpha ramps 0 -> 0.6)
 * 0.6 - 0.9: Full night (alpha = 0.3)
 * 0.9 - 1.0: Dawn transition (alpha ramps 0.3 -> 0)
 * 
 * @param timeOfDay - Float between 0.0 and 1.0. If undefined, defaults to 0.
 * @returns An alpha value between 0.0 and 0.3.
 */
export function getNightAlpha(timeOfDay: number | undefined): number {
  if (timeOfDay === undefined) return 0;
  
  // Wrap to [0, 1) just in case
  let t = timeOfDay % 1.0;
  if (t < 0) t += 1.0;
  
  if (t < 0.5) return 0;
  if (t < 0.6) return 0.6 * ((t - 0.5) / 0.1);
  if (t < 0.9) return 0.6;
  return 0.6 * (1.0 - ((t - 0.9) / 0.1));
}
