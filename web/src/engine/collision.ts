import { random } from './random';
import type { WorldState, Creature, Plant } from '../types'
import { CARNIVORE_EAT_RANGE, HERBIVORE_EAT_RANGE, BASE_RENDER_SIZE } from '../constants'
import { audio } from './audioEngine'
import { hunts } from './ai/Thoughts'
import { spawnPlant, killCreature, killPlant, nextPlantId } from './entityManager'

/**
 * collision.ts — food-chain collision detection.
 * Includes real-time combat damage exchange.
 */

export function runCollision(world: WorldState, _dt: number): void {
  const deletedCreatureIds = world.scratchpad.deletedCreatureIds;
  const deletedPlantIds    = world.scratchpad.deletedPlantIds;

  // We compute range per-creature now based on their dynamic size

  // Combat loop
  const nearbyCreatures: Creature[] = [];
  for (let i = 0; i < world.creatures.length; i++) {
    const a = world.creatures[i]
    if (deletedCreatureIds.has(a.id)) continue

    const aRadius = (BASE_RENDER_SIZE * a.currentScale * a.renderScale) / 2;
    const maxCombatSearchRadius = aRadius + 100 + CARNIVORE_EAT_RANGE; // Safe upper bound for any other creature's radius

    world.scratchpad.spatialGrid.getNearbyCreatures(a.x, a.y, maxCombatSearchRadius, nearbyCreatures);

    for (let j = 0; j < nearbyCreatures.length; j++) {
      const b = nearbyCreatures[j]
      if (a.id >= b.id) continue; // Prevent self-collision and duplicate pair processing
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
        // Combat reach scales with the attacker's physical size
        const aRadius = (BASE_RENDER_SIZE * a.currentScale * a.renderScale) / 2;
        const bRadius = (BASE_RENDER_SIZE * b.currentScale * b.renderScale) / 2;
        
        // Attack range is the attacker's body radius + base eat range
        let combatRange = 0;
        if (aHuntsB && bHuntsA) combatRange = Math.max(aRadius, bRadius) + CARNIVORE_EAT_RANGE;
        else if (aHuntsB) combatRange = aRadius + CARNIVORE_EAT_RANGE;
        else if (bHuntsA) combatRange = bRadius + CARNIVORE_EAT_RANGE;

        if (distSq < combatRange * combatRange) {
          // Combat happens!
          a.state = 'FIGHTING'
          b.state = 'FIGHTING'
          
          // Double damage during the momentum of a lunge
          const aBurst = a.lungeTimer > 0 ? 2 : 1;
          const bBurst = b.lungeTimer > 0 ? 2 : 1;

          const aDmg = b.damage * bBurst * _dt;
          const bDmg = a.damage * aBurst * _dt;

          a.health -= aDmg;
          b.health -= bDmg;
          
          if (a.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.damageCarn += aDmg;
          else if (a.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.damageOmni += aDmg;
          else if (a.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.damageHerb += aDmg;

          if (b.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.damageCarn += bDmg;
          else if (b.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.damageOmni += bDmg;
          else if (b.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.damageHerb += bDmg;
          
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
          // FYI: killCreature just flags the ID and defers actual array removal.
          // This prevents weird double-kill / double-meat bugs because the top of
          // the outer loop checks deletedCreatureIds.has(c.id).
          if (a.health <= 0) {
            killCreature(world, a.id)
            if (a.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.huntedCarn++;
            else if (a.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.huntedOmni++;
            else if (a.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.huntedHerb++;
            spawnPlant(world, {
              id: nextPlantId(),
              type: 'MEAT',
              x: a.x,
              y: a.y,
              growthStage: 1.0,
              wobblePhase: random() * Math.PI * 2
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
            if (b.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.huntedCarn++;
            else if (b.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.huntedOmni++;
            else if (b.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.huntedHerb++;
            spawnPlant(world, {
              id: nextPlantId(),
              type: 'MEAT',
              x: b.x,
              y: b.y,
              growthStage: 1.0,
              wobblePhase: random() * Math.PI * 2
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
  const nearbyPlants: Plant[] = [];
  for (const c of world.creatures) {
    if (deletedCreatureIds.has(c.id) || c.z > 20) continue

    const cRadius = (BASE_RENDER_SIZE * c.currentScale * c.renderScale) / 2;
    const maxSearchRadius = cRadius + Math.max(CARNIVORE_EAT_RANGE, HERBIVORE_EAT_RANGE);
    world.scratchpad.spatialGrid.getNearbyPlants(c.x, c.y, maxSearchRadius, nearbyPlants);

    for (const p of nearbyPlants) {
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
      const cRadius = (BASE_RENDER_SIZE * c.currentScale * c.renderScale) / 2;
      const eatRange = cRadius + (isMeat ? CARNIVORE_EAT_RANGE : HERBIVORE_EAT_RANGE);
      
      if (dx * dx + dy * dy < eatRange * eatRange) {
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
        if (c.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.caloriesCarn += plantEnergy;
        else if (c.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.caloriesOmni += plantEnergy;
        else if (c.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.caloriesHerb += plantEnergy;
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
      if (c.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.starvationCarn++;
      else if (c.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.starvationOmni++;
      else if (c.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.starvationHerb++;
    }
  }

  // No return, sets are mutated in-place
}
