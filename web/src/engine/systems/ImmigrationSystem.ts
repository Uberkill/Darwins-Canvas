import type { WorldState } from '../../types';
import { getGlobalPopulationCap } from '../../constants';

export class ImmigrationSystem {
  /**
   * Re-seeds extinct populations by queuing migrants to be dropped from the sky.
   * Migrants are processed asynchronously by the outer game loop so it can query
   * the local database for saved creatures without stalling the physics engine.
   *
   * Guards:
   *   - Herbivores only arrive when carnivore count ≤ 3 (safe enough to survive & reproduce)
   *   - Carnivores only arrive when herbivore prey count ≥ 3 (enough food to sustain them)
   *   - Omnivores arrive when carnivore count ≤ 5 (tougher, can eat plants as fallback)
   */
  static update(world: WorldState, dt: number): void {
    if (!world.scratchpad.immigrationTimer) {
      world.scratchpad.immigrationTimer = 0;
    }
    if (!world.scratchpad.pendingImmigrations) {
      world.scratchpad.pendingImmigrations = [];
    }
    
    world.scratchpad.immigrationTimer += dt;
    
    if (world.scratchpad.immigrationTimer > 60) { // Check every 60 seconds
      world.scratchpad.immigrationTimer = 0;
      
      if (world.creatures.length >= getGlobalPopulationCap(world.worldWidth, world.worldHeight)) return;

      let herbivores = 0, carnivores = 0, omnivores = 0;
      for (const c of world.creatures) {
         if (c.health > 0) {
           if (c.diet === 'HERBIVORE') herbivores++;
           else if (c.diet === 'CARNIVORE') carnivores++;
           else if (c.diet === 'OMNIVORE') omnivores++;
         }
      }

      // Guaranteed spawn — no RNG gate. Used for founding pairs.
      const queueAlways = (diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE') => {
        world.scratchpad.pendingImmigrations!.push(diet);
      };

      // 25% chance spawn — used for bonus slots.
      const queueChance = (diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE', chance = 0.25) => {
        if (Math.random() < chance) world.scratchpad.pendingImmigrations!.push(diet);
      };

      // ── Herbivores: only send when carnivores ≤ 3 so immigrants can survive long enough to breed ──
      if (herbivores === 0 && carnivores <= 3) {
        queueAlways('HERBIVORE');  // guaranteed — founding pair member 1
        queueAlways('HERBIVORE');  // guaranteed — founding pair member 2
        queueChance('HERBIVORE', 0.50); // 50% bonus third
      }

      // ── Carnivore: apex migrant — only when prey exists to sustain it ──
      if (carnivores === 0 && herbivores >= 3) queueChance('CARNIVORE');

      // ── Omnivore: send pair when not too many carnivores around ──
      if (omnivores === 0 && carnivores <= 5) {
        queueAlways('OMNIVORE');  // guaranteed
        queueChance('OMNIVORE', 0.50); // 50% bonus
      }
    }
  }
}
