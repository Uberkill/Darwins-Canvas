import type { WorldState } from '../types'
import { CARNIVORE_EAT_RANGE, HERBIVORE_EAT_RANGE } from '../constants'
import { audio } from './audioEngine'
import { hunts } from './ai/Thoughts'
import { spawnPlant, killCreature, killPlant } from './entityManager'

/**
 * collision.ts — food-chain collision detection.
 * Includes real-time combat damage exchange.
 */

export function runCollision(world: WorldState, _dt: number): void {
  const deletedCreatureIds = world.scratchpad.deletedCreatureIds;
  const deletedPlantIds    = world.scratchpad.deletedPlantIds;

  const carnRangeSq = CARNIVORE_EAT_RANGE * CARNIVORE_EAT_RANGE
  const herbRangeSq = HERBIVORE_EAT_RANGE * HERBIVORE_EAT_RANGE

  // Combat loop
  for (let i = 0; i < world.creatures.length; i++) {
    const a = world.creatures[i]
    if (deletedCreatureIds.has(a.id)) continue

    for (let j = i + 1; j < world.creatures.length; j++) {
      const b = world.creatures[j]
      if (deletedCreatureIds.has(b.id)) continue

      // Z-Gate Hitbox: strictly enforce absolute height. Airborne creatures cannot attack or be attacked.
      if (a.z > 30 || b.z > 30) continue

      const dx = a.x - b.x
      const dy = a.y - b.y
      const distSq = dx * dx + dy * dy

      // Check hostility using the unified AI logic
      const aHuntsB = hunts(a, b);
      const bHuntsA = hunts(b, a);

      if (aHuntsB || bHuntsA) {
        if (distSq < carnRangeSq) {
          // Combat happens!
          a.state = 'FIGHTING'
          b.state = 'FIGHTING'
          
          // Double damage during the momentum of a lunge
          const aBurst = a.lungeTimer > 0 ? 2 : 1;
          const bBurst = b.lungeTimer > 0 ? 2 : 1;

          a.health -= (b.damage * bBurst) * _dt;
          b.health -= (a.damage * aBurst) * _dt;
          
          if (b.damage > 0) {
            if (a.hitTimer <= 0) {
              audio.playCreatureEvent('HURT', a.x, a.y, a.currentScale, a.diet);
            }
            a.hitTimer = 0.2;
          }
          if (a.damage > 0) {
            if (b.hitTimer <= 0) {
              audio.playCreatureEvent('HURT', b.x, b.y, b.currentScale, b.diet);
            }
            b.hitTimer = 0.2;
          }

          // Determine death
          if (a.health <= 0) {
            killCreature(world, a.id)
            spawnPlant(world, {
              id: crypto.randomUUID(),
              type: 'MEAT',
              x: a.x,
              y: a.y,
              growthStage: 1.0,
              wobblePhase: Math.random() * Math.PI * 2
            })
            if (bHuntsA && b.health > 0) {
              b.hunger = 100
              b.state = 'EATING'
              b.eatingTimer = b.diet === 'CARNIVORE' ? 15.0 : 0.5
              b.kills += 1
            }
          }
          if (b.health <= 0) {
            killCreature(world, b.id)
            spawnPlant(world, {
              id: crypto.randomUUID(),
              type: 'MEAT',
              x: b.x,
              y: b.y,
              growthStage: 1.0,
              wobblePhase: Math.random() * Math.PI * 2
            })
            if (aHuntsB && a.health > 0) {
              a.hunger = 100
              a.state = 'EATING'
              a.eatingTimer = a.diet === 'CARNIVORE' ? 15.0 : 0.5
              a.kills += 1
            }
          }
          if (a.health <= 0) break;
        }
      }
    }
  }

  // Feeding loop (Plants & Meat)
  for (const c of world.creatures) {
    if (deletedCreatureIds.has(c.id) || c.z > 20) continue

    for (const p of world.plants) {
      if (deletedPlantIds.has(p.id)) continue
      
      const isMeat = p.type === 'MEAT';
      let canEat = false;
      if (isMeat) {
        if (c.diet === 'CARNIVORE' || (c.diet === 'OMNIVORE' && c.hunger < 20)) canEat = true;
      } else {
        if (c.diet === 'HERBIVORE' || c.diet === 'OMNIVORE' || (c.diet === 'CARNIVORE' && c.hunger < 20)) canEat = true;
      }

      if (!canEat) continue;

      const dx = c.x - p.x
      const dy = c.y - p.y
      if (dx * dx + dy * dy < herbRangeSq) {
        killPlant(world, p.id)
        
        let plantEnergy = 15;
        if (isMeat) {
          if (c.diet === 'CARNIVORE') plantEnergy = 100; // Meat is perfect nutrition for carnivores
          else plantEnergy = 80;
        } else if (p.growthStage >= 1.0) {
          plantEnergy = 60;
        } else if (p.growthStage >= 0.5) {
          plantEnergy = 20;
        }
        
        if (c.diet === 'CARNIVORE' && !isMeat) {
          plantEnergy = Math.floor(plantEnergy * 0.25); // Desperate carnivore gets little energy from grass
        }
        
        c.hunger = Math.min(100, c.hunger + plantEnergy)
        c.state = 'EATING'
        c.eatingTimer = (c.diet === 'CARNIVORE' && isMeat) ? 15.0 : 0.5
        c.foodEaten += 1
        
        // Stop checking other food once we've eaten one this frame
        break;
      }
    }
  }

  // Process starvation deaths outside of combat
  for (const c of world.creatures) {
    if (c.health <= 0 && !deletedCreatureIds.has(c.id)) {
      killCreature(world, c.id)
    }
  }

  // No return, sets are mutated in-place
}
