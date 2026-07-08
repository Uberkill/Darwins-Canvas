import type { WorldState } from '../../types'
import { audio } from '../audioEngine'
import {
  FLEEING_HUNGER_MULTIPLIER, HUNTING_HUNGER_MULTIPLIER,
  PASSIVE_HEAL_RATE, STARVATION_DAMAGE,
  STAMINA_DRAIN_RATE, STAMINA_REGEN_RATE,
  LUNGE_DURATION, LUNGE_COOLDOWN
} from '../../constants'

const ADULT_AGE = 30; // 30 seconds to reach full size

export const LifeSystem = {
  update(world: WorldState, dt: number, globalSightPenalty: number) {
    for (const creature of world.creatures) {
      creature.age += dt
      
      // XP & Level Logic (Non-Linear)
      let newLevel = 1;
      if (creature.diet === 'HERBIVORE') {
        newLevel = 1 + Math.floor(Math.sqrt(creature.foodEaten / 5));
      } else if (creature.diet === 'CARNIVORE') {
        newLevel = 1 + Math.floor(Math.sqrt(creature.kills * 3));
      } else if (creature.diet === 'OMNIVORE') {
        newLevel = 1 + Math.floor(Math.sqrt((creature.kills * 2) + (creature.foodEaten / 10)));
      }
      
      const oldLevel = creature.level;
      creature.level = Math.min(100, newLevel); // Hard-capped at 100 to prevent Infinity maxAge

      if (creature.level > oldLevel) {
        // Trigger spatial level up sound
        audio.playLevelUp(creature.x, creature.y);
        
        // God-tier lifespan bonus: +60 seconds per level past 10, capped at 600s
        if (creature.level > 10) {
          const levelsGained = creature.level - Math.max(10, oldLevel);
          creature.maxAge = Math.min(600, creature.maxAge + (levelsGained * 60));
        }
      }

      // Apply Level Bonuses (10% HP/Stamina, 2% Speed, 5% Scale, 10% Damage per level above 1)
      // We cap the physical stat bonuses at level 20 to prevent physics engine breakage
      const statBonusLevel = Math.min(20, creature.level);
      const levelBonus = statBonusLevel - 1;
      creature.maxHealth = creature.baseStats.maxHealth * (1 + 0.10 * levelBonus);
      creature.maxStamina = 100 * (1 + 0.10 * levelBonus); // Assuming base maxStamina is 100
      creature.speed = creature.baseStats.speed * (1 + 0.02 * levelBonus);
      creature.renderScale = creature.baseStats.renderScale * (1 + 0.05 * levelBonus);
      creature.damage = creature.baseStats.damage * (1 + 0.10 * levelBonus);

      // Age-based Live Scaling
      let ageScale = 1.5;
      if (creature.age < ADULT_AGE) {
        ageScale = 0.5 + (creature.age / ADULT_AGE) * 1.0;
      } else if (creature.age > creature.maxAge * 0.8) {
        const oldAgeProgress = (creature.age - creature.maxAge * 0.8) / (creature.maxAge * 0.2);
        ageScale = 1.5 - (oldAgeProgress * 0.3);
      }
      creature.currentScale = ageScale;

      // Senescence (Organic Aging)
      if (creature.age > creature.maxAge) {
        const overAge = creature.age - creature.maxAge;
        const penaltyMultiplier = Math.max(0.1, 1 - (overAge * 0.02)); 
        
        creature.maxHealth *= penaltyMultiplier;
        creature.speed *= penaltyMultiplier;
        creature.damage *= penaltyMultiplier;
        
        // Increase hunger drain drastically (up to 3x)
        creature.hungerDrainRate = creature.baseDrainRate * Math.min(3, 1 + (overAge * 0.05));
        
        // Hard cap death at maxAge + 120s (senescence can only last 2 minutes max)
        if (overAge > 120) {
          creature.health = 0;
        }
      } else {
         creature.hungerDrainRate = creature.baseDrainRate;
      }

      // Sleep behavior
      const isNight = globalSightPenalty < 0.9;
      let shouldSleep = false;
      if (creature.behavior !== 'FLEEING' && creature.health > 50) {
        if (isNight && creature.diet !== 'CARNIVORE' && creature.hunger > 30) {
          shouldSleep = true; // Herbivores/Omnivores sleep at night (unless starving)
        } else if (!isNight && creature.diet === 'CARNIVORE' && creature.hunger > 60) {
          shouldSleep = true; // Carnivores catnap during the day (unless hungry)
        }
      }
      
      if (shouldSleep) {
        creature.behavior = 'SLEEPING' as any;
      } else if (creature.behavior === 'SLEEPING' as any) {
        creature.behavior = 'WANDERING';
      }

      if (creature.behavior === 'FLEEING' || (creature.behavior === 'FORAGING' && creature.diet !== 'HERBIVORE')) {
        creature.stamina = Math.max(0, creature.stamina - STAMINA_DRAIN_RATE * dt);
      } else {
        creature.stamina = Math.min(creature.maxStamina, creature.stamina + STAMINA_REGEN_RATE * dt);
      }

      if (creature.lungeCooldownTimer > 0) {
        creature.lungeCooldownTimer -= dt;
      }
      if (creature.lungeTimer > 0) {
        creature.lungeTimer -= dt;
        // EXTRA EXTREME STAMINA DRAIN: Lunging burns stamina 1.5x faster
        creature.stamina = Math.max(0, creature.stamina - (STAMINA_DRAIN_RATE * 1.5 * dt));
      }
      if (creature.hitTimer > 0) {
        creature.hitTimer -= dt;
      }

      if (creature.diet === 'CARNIVORE' && creature.behavior === 'FORAGING') {
        // Trigger Lunge if they are chasing meat, not on cooldown, and have stamina
        if (creature.lungeCooldownTimer <= 0 && creature.lungeTimer <= 0 && creature.stamina > 20) {
          creature.lungeTimer = LUNGE_DURATION;
          creature.lungeCooldownTimer = LUNGE_DURATION + LUNGE_COOLDOWN;
          audio.playCreatureEvent('ATTACK', creature.x, creature.y, creature.currentScale, creature.diet);
        }
      }

      let drainMultiplier = 1.0
      if (creature.behavior === 'SLEEPING' as any) {
        drainMultiplier = 0.2;
        creature.state = 'IDLE';
        audio.playCreatureEvent('SLEEP', creature.x, creature.y, creature.currentScale, creature.diet);
      }
      if (creature.behavior === 'FLEEING') drainMultiplier = FLEEING_HUNGER_MULTIPLIER
      else if (creature.behavior === 'FORAGING' && creature.diet === 'CARNIVORE') drainMultiplier = HUNTING_HUNGER_MULTIPLIER

      creature.hunger -= creature.hungerDrainRate * drainMultiplier * dt

      // Health Regeneration or Starvation
      if (creature.hunger > 80) {
        creature.health = Math.min(creature.maxHealth, creature.health + PASSIVE_HEAL_RATE * dt)
      } else if (creature.hunger <= 0) {
        creature.health -= STARVATION_DAMAGE * dt
      }

      const wasEating = creature.state === 'EATING';
      if (creature.eatingTimer > 0) {
        creature.eatingTimer -= dt;
        creature.state = 'EATING';
        // Only play the eat sound if it just started eating
        if (!wasEating) {
          audio.playCreatureEvent('EAT', creature.x, creature.y, creature.currentScale, creature.diet);
        }
      } else if (creature.state === 'EATING') {
        creature.state = 'MOVING';
      }
    }
  }
}
