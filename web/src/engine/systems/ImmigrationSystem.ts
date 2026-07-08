import type { WorldState, Creature } from '../../types';
import { buildCreature } from '../creatureFactory';

export class ImmigrationSystem {
  /**
   * Re-seeds extinct populations by dropping migrants from the sky.
   * Returns an array of new migrant creatures to be safely added to the world.
   */
  static update(world: WorldState, dt: number): Creature[] {
    const migrants: Creature[] = [];

    if (!world.scratchpad.immigrationTimer) {
      world.scratchpad.immigrationTimer = 0;
    }
    
    world.scratchpad.immigrationTimer += dt;
    
    if (world.scratchpad.immigrationTimer > 120) { // Check every 120 seconds
      world.scratchpad.immigrationTimer = 0;
      
      let herbivores = 0, carnivores = 0, omnivores = 0;
      for (const c of world.creatures) {
         if (c.health > 0) {
           if (c.diet === 'HERBIVORE') herbivores++;
           else if (c.diet === 'CARNIVORE') carnivores++;
           else if (c.diet === 'OMNIVORE') omnivores++;
         }
      }

      const spawnMigrant = (diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE') => {
        // 5% chance to migrate if extinct
        if (Math.random() < 0.05) {
          const side = Math.random() < 0.5 ? 0 : world.worldWidth;
          const y = Math.random() * (world.worldHeight - 200) + 100;
          const migrantColor = diet === 'HERBIVORE' ? 'green' : diet === 'CARNIVORE' ? 'red' : 'purple';
          const migrantSVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${migrantColor}"/></svg>`;
          const migrant = buildCreature({
             name: 'Migrant ' + diet.charAt(0) + diet.slice(1).toLowerCase(),
             diet,
             size: 'MEDIUM',
             movement: 'CRAWLER',
             drawingData: migrantSVG,
             decals: []
          }, world.worldWidth, world.worldHeight);
          migrant.x = side;
          migrant.y = y;
          migrants.push(migrant);
        }
      };

      if (herbivores === 0) spawnMigrant('HERBIVORE');
      if (carnivores === 0) spawnMigrant('CARNIVORE');
      if (omnivores === 0) spawnMigrant('OMNIVORE');
    }

    return migrants;
  }
}
