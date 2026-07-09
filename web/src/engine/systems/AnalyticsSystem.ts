import type { WorldState } from '../../types';

export class AnalyticsSystem {
  /**
   * Pushes history points to the Analytics timeline.
   */
  static update(world: WorldState, dtSec: number) {
    world.historyTimer += dtSec;
    if (world.historyTimer >= 1.0) {
      world.historyTimer = 0;

      let carnivore = 0;
      let omnivore = 0;
      let herbivore = 0;
      let maxGeneration = 1;

      for (let i = 0; i < world.creatures.length; i++) {
        const c = world.creatures[i];
        if (c.diet === 'CARNIVORE') carnivore++;
        else if (c.diet === 'OMNIVORE') omnivore++;
        else if (c.diet === 'HERBIVORE') herbivore++;
        
        if (c.generation > maxGeneration) {
          maxGeneration = c.generation;
        }
      }

      let plant = 0;
      let meat = 0;
      for (let i = 0; i < world.plants.length; i++) {
        if (world.plants[i].type === 'MEAT') meat++;
        else plant++;
      }

      world.analytics.history.push({
        time: world.totalTime,
        carnivore, omnivore, herbivore, plant, meat,
        birthsCarn: world.analytics.currentSecondAccumulator.birthsCarn,
        birthsOmni: world.analytics.currentSecondAccumulator.birthsOmni,
        birthsHerb: world.analytics.currentSecondAccumulator.birthsHerb,
        starvationCarn: world.analytics.currentSecondAccumulator.starvationCarn,
        starvationOmni: world.analytics.currentSecondAccumulator.starvationOmni,
        starvationHerb: world.analytics.currentSecondAccumulator.starvationHerb,
        huntedCarn: world.analytics.currentSecondAccumulator.huntedCarn,
        huntedOmni: world.analytics.currentSecondAccumulator.huntedOmni,
        huntedHerb: world.analytics.currentSecondAccumulator.huntedHerb,
        damageCarn: world.analytics.currentSecondAccumulator.damageCarn,
        damageOmni: world.analytics.currentSecondAccumulator.damageOmni,
        damageHerb: world.analytics.currentSecondAccumulator.damageHerb,
        caloriesCarn: world.analytics.currentSecondAccumulator.caloriesCarn,
        caloriesOmni: world.analytics.currentSecondAccumulator.caloriesOmni,
        caloriesHerb: world.analytics.currentSecondAccumulator.caloriesHerb,
        maxGeneration
      });
      
      // Zero out the interval accumulators
      const accum = world.analytics.currentSecondAccumulator;
      accum.birthsCarn = 0; accum.birthsOmni = 0; accum.birthsHerb = 0;
      accum.starvationCarn = 0; accum.starvationOmni = 0; accum.starvationHerb = 0;
      accum.huntedCarn = 0; accum.huntedOmni = 0; accum.huntedHerb = 0;
      accum.damageCarn = 0; accum.damageOmni = 0; accum.damageHerb = 0;
      accum.caloriesCarn = 0; accum.caloriesOmni = 0; accum.caloriesHerb = 0;
      
      // Prevent infinite memory leak over long play sessions (cap to 1 hour of history at 1 tick/sec)
      if (world.analytics.history.length > 3600) {
        world.analytics.history.shift();
      }
    }
  }
}
