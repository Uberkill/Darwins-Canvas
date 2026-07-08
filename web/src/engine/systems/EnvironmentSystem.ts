import type { WorldState } from '../../types';
import {
  DAY_NIGHT_CYCLE_DURATION,
  WEATHER_CYCLE_DURATION,
  NIGHT_SIGHT_PENALTY
} from '../../constants';

export class EnvironmentSystem {
  /**
   * Updates the macro environment (Time of day, Weather, Sight Penalty).
   * Returns the calculated globalSightPenalty to be passed to physics systems.
   */
  static update(world: WorldState, dt: number): number {
    world.timeOfDay = (world.timeOfDay + dt / DAY_NIGHT_CYCLE_DURATION) % 1.0;
    
    const weatherPhase = (world.totalTime % (WEATHER_CYCLE_DURATION * 2)) / WEATHER_CYCLE_DURATION;
    if (weatherPhase < 1.0) {
      world.weather = 'CLEAR';
    } else if (weatherPhase < 1.5) {
      world.weather = 'RAIN';
    } else {
      world.weather = 'DROUGHT';
    }

    let globalSightPenalty = 1.0;
    if (world.timeOfDay > 0.6 && world.timeOfDay < 0.9) {
      globalSightPenalty = 1.0 - NIGHT_SIGHT_PENALTY;
    } else if (world.timeOfDay >= 0.5 && world.timeOfDay <= 0.6) {
      const t = (world.timeOfDay - 0.5) / 0.1;
      globalSightPenalty = 1.0 - (NIGHT_SIGHT_PENALTY * t);
    } else if (world.timeOfDay >= 0.9 && world.timeOfDay <= 1.0) {
      const t = (world.timeOfDay - 0.9) / 0.1;
      globalSightPenalty = (1.0 - NIGHT_SIGHT_PENALTY) + (NIGHT_SIGHT_PENALTY * t);
    }

    return globalSightPenalty;
  }
}
