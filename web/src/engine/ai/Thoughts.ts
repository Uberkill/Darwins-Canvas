import type { Creature, WorldState, Plant } from '../../types'

export interface PerceptionResult {
  targetType: 'FLEE' | 'HUNTS_PLANT' | 'HUNTS_MEAT' | 'HUNTS_SCAVENGE' | 'LURE' | null;
  targetX: number;
  targetY: number;
  targetId: string | null;
}

// Zero-allocation shared buffers for O(N) spatial queries
const nearbyCreatures: Creature[] = [];
const nearbyPlants: Plant[] = [];
const sharedResult: PerceptionResult = {
  targetType: null,
  targetX: 0,
  targetY: 0,
  targetId: null
};

function sizeValue(s: string) {
  return s === 'SMALL' ? 1 : s === 'MEDIUM' ? 2 : 3;
}

export function hunts(hunter: Creature, prey: Creature): boolean {
  const hSize = sizeValue(hunter.size);
  const pSize = sizeValue(prey.size);

  if (hunter.diet === 'CARNIVORE') {
    // Carnivores hunt Herbivores/Omnivores if they are large enough to hurt them
    if (prey.diet === 'HERBIVORE' || prey.diet === 'OMNIVORE') {
      return hSize >= pSize; 
    }
    
    // Carnivores cannibalize if starving, but only if strictly larger than prey's size.
    if (prey.diet === 'CARNIVORE') {
       return hunter.hunger < 20 && hSize > pSize;
    }
  } else if (hunter.diet === 'OMNIVORE') {
    // Omnivores hunt only as a desperate last resort
    if (hunter.hunger < 20) {
       if (prey.diet === 'HERBIVORE') return hSize >= pSize;
       if (prey.diet === 'CARNIVORE' || prey.diet === 'OMNIVORE') return hSize > pSize;
    }
  }
  return false;
}

export function evaluateThoughts(c: Creature, world: WorldState, timeOfDay: number): PerceptionResult {
  let closestDistSq = Infinity
  let closestTargetX = 0
  let closestTargetY = 0
  let closestTargetId: string | null = null
  let targetType: 'FLEE' | 'HUNTS_PLANT' | 'HUNTS_MEAT' | 'HUNTS_SCAVENGE' | 'LURE' | null = null

  // 0. The Hand of God (Lure overrides all if very close)
  if (world.activeLure) {
    const lx = world.activeLure.x - c.x
    const ly = world.activeLure.y - c.y
    const ldSq = lx * lx + ly * ly
    if (ldSq < c.sightRadius * c.sightRadius * 2.25) {
      closestDistSq = ldSq
      closestTargetX = world.activeLure.x
      closestTargetY = world.activeLure.y
      closestTargetId = 'LURE'
      targetType = 'LURE'
    }
  }

  const safeBravery = Number.isNaN(c.bravery) ? 0.5 : Math.max(0, Math.min(1, c.bravery));
  const braveryModifier = Math.max(0.4, 1.0 - safeBravery);
  const effectiveFleeRadius = c.sightRadius * braveryModifier;
  const fleeRadiusSq = effectiveFleeRadius * effectiveFleeRadius;
  const sightSq = c.sightRadius * c.sightRadius;

  world.scratchpad.spatialGrid.getNearbyCreatures(c.x, c.y, c.sightRadius, nearbyCreatures);

  // 1. Check Predators (Fear) - Survival is the highest priority
  // This must override LURE, even if the predator is further away than the lure.
  for (let j = 0; j < nearbyCreatures.length; j++) {
    const other = nearbyCreatures[j]
    if (c.id === other.id || world.scratchpad.deletedCreatureIds.has(other.id)) continue

    if (hunts(other, c)) {
      const dx = other.x - c.x
      const dy = other.y - c.y
      const dSq = dx * dx + dy * dy
      if (dSq < fleeRadiusSq) {
        if (targetType !== 'FLEE') {
          closestDistSq = dSq
          closestTargetX = other.x
          closestTargetY = other.y
          closestTargetId = other.id
          targetType = 'FLEE'
        } else if (dSq < closestDistSq) {
          closestDistSq = dSq
          closestTargetX = other.x
          closestTargetY = other.y
          closestTargetId = other.id
        }
      }
    }
  }

  const isPanicking = c.panicTimer > 0;

  // 2. Check Hunting Meat (Aggression, only if not scared/lured)
  if (targetType !== 'LURE' && targetType !== 'FLEE' && !isPanicking && c.hunger < 80) {
    if (c.diet === 'CARNIVORE' && c.hunger > 75) {
      // Selective Hunting: carnivores ignore prey unless genuinely hungry to avoid extinction loops.
    } else {
      let bestScore = Infinity;
      for (let j = 0; j < nearbyCreatures.length; j++) {
        const other = nearbyCreatures[j]
        if (c.id === other.id || world.scratchpad.deletedCreatureIds.has(other.id)) continue
        
        if (hunts(c, other)) {
          const dx = other.x - c.x
          const dy = other.y - c.y
          const dSq = dx * dx + dy * dy
          if (dSq < sightSq) {
            let score = dSq;
            if (c.diet === 'CARNIVORE') {
              const healthRatio = Math.max(0.1, other.health / other.maxHealth);
              score = Math.sqrt(dSq) * healthRatio; 
            }

            if (targetType !== 'HUNTS_MEAT') {
              bestScore = score
              closestDistSq = dSq
              closestTargetX = other.x
              closestTargetY = other.y
              closestTargetId = other.id
              targetType = 'HUNTS_MEAT'
            } else if (score < bestScore) {
              bestScore = score
              closestDistSq = dSq
              closestTargetX = other.x
              closestTargetY = other.y
              closestTargetId = other.id
            }
          }
        }
      }
    }
  }

  // Pre-fetch plants only if needed to save time
  const isHungryCarnivore = c.diet === 'CARNIVORE' && c.hunger < 90;
  const isStarvingOmnivore = c.diet === 'OMNIVORE' && c.hunger < 20;
  const canEatPlants = c.diet === 'HERBIVORE' || c.diet === 'OMNIVORE' || (c.diet === 'CARNIVORE' && c.hunger < 20);

  if (targetType !== 'LURE' && targetType !== 'FLEE' && !isPanicking && (isHungryCarnivore || isStarvingOmnivore || canEatPlants)) {
    world.scratchpad.spatialGrid.getNearbyPlants(c.x, c.y, c.sightRadius, nearbyPlants);
  }

  // 3. Check Scavenging (Dropped Meat)
  if (targetType !== 'LURE' && targetType !== 'FLEE' && !isPanicking &&
      (isHungryCarnivore || isStarvingOmnivore)) {
    for (let k = 0; k < nearbyPlants.length; k++) {
      const p = nearbyPlants[k];
      if (world.scratchpad.deletedPlantIds.has(p.id) || p.type !== 'MEAT') continue;
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      const dSq = dx * dx + dy * dy;
      if (dSq < sightSq && dSq < closestDistSq) {
        closestDistSq = dSq;
        closestTargetX = p.x;
        closestTargetY = p.y;
        closestTargetId = p.id;
        targetType = 'HUNTS_SCAVENGE';
      }
    }
  }

  // 4. Check Foraging Plants
  if (targetType !== 'LURE' && targetType !== 'FLEE' && targetType !== 'HUNTS_MEAT' && targetType !== 'HUNTS_SCAVENGE' && !isPanicking && canEatPlants) {
    for (let k = 0; k < nearbyPlants.length; k++) {
      const plant = nearbyPlants[k]
      if (world.scratchpad.deletedPlantIds.has(plant.id) || plant.type === 'MEAT') continue;
      const dx = plant.x - c.x
      const dy = plant.y - c.y
      const dSq = dx * dx + dy * dy
      if (dSq < sightSq && dSq < closestDistSq) {
        closestDistSq = dSq
        closestTargetX = plant.x
        closestTargetY = plant.y
        closestTargetId = plant.id
        targetType = 'HUNTS_PLANT'
      }
    }
  }

  // Mutate mood and intent based on findings
  if (targetType === 'FLEE') {
    c.mood = 'SCARED';
    c.intent = 'Panicking! Running for my life!';
    c.behavior = 'FLEEING';
  } else if (targetType === 'HUNTS_MEAT') {
    c.mood = 'ANGRY';
    c.intent = 'Hunting prey!';
    c.behavior = 'FORAGING';
  } else if (targetType === 'HUNTS_SCAVENGE') {
    c.mood = 'HUNGRY';
    c.intent = 'Found some delicious meat...';
    c.behavior = 'FORAGING';
  } else if (targetType === 'HUNTS_PLANT') {
    c.mood = 'HUNGRY';
    c.intent = 'Looking for a snack...';
    c.behavior = 'FORAGING';
  } else if (targetType === 'LURE') {
    c.mood = 'HAPPY';
    c.intent = 'Ooh, what is that?';
    c.behavior = 'FORAGING'; // Lure acts like foraging
  } else {
    // If no target, check sleep
    const isNight = timeOfDay > 0.5 && timeOfDay < 1.0;
    if (isNight && c.diet === 'HERBIVORE') {
      c.mood = 'SLEEPY';
      c.intent = 'Sleeping...';
      c.behavior = 'SLEEPING';
    } else {
      c.mood = 'HAPPY';
      c.intent = 'Just wandering...';
      c.behavior = 'WANDERING';
    }
  }

  sharedResult.targetType = targetType;
  sharedResult.targetX = closestTargetX;
  sharedResult.targetY = closestTargetY;
  sharedResult.targetId = closestTargetId;
  return sharedResult;
}
