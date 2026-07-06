import type { Creature, WorldState } from '../../types'

export interface PerceptionResult {
  targetType: 'FLEE' | 'HUNTS_PLANT' | 'HUNTS_MEAT' | 'LURE' | null;
  targetX: number;
  targetY: number;
  targetId: string | null;
}

export function evaluateThoughts(c: Creature, world: WorldState, timeOfDay: number): PerceptionResult {
  let closestDistSq = Infinity
  let closestTargetX = 0
  let closestTargetY = 0
  let closestTargetId: string | null = null
  let targetType: 'FLEE' | 'HUNTS_PLANT' | 'HUNTS_MEAT' | 'LURE' | null = null

  // 0. The Hand of God (Lure overrides all if very close, but only if they aren't terrified)
  if (world.activeLure) {
    const lx = world.activeLure.x - c.x
    const ly = world.activeLure.y - c.y
    const ldSq = lx * lx + ly * ly
    // If lure is within sight (even 1.5x sight), get curious
    if (ldSq < c.sightRadius * c.sightRadius * 2.25) {
      closestDistSq = ldSq
      closestTargetX = world.activeLure.x
      closestTargetY = world.activeLure.y
      closestTargetId = 'LURE'
      targetType = 'LURE'
    }
  }

  const safeBravery = Number.isNaN(c.bravery) ? 0.5 : Math.max(0, Math.min(1, c.bravery));
  const braveryModifier = Math.max(0.1, 1.0 - safeBravery);
  const effectiveFleeRadius = c.sightRadius * braveryModifier;
  const fleeRadiusSq = effectiveFleeRadius * effectiveFleeRadius;
  const sightSq = c.sightRadius * c.sightRadius;

  // 1. Check Predators (Highest Priority)
  for (let j = 0; j < world.creatures.length; j++) {
    const other = world.creatures[j]
    if (c.id === other.id || world.scratchpad.deletedCreatureIds.has(other.id)) continue

    const bHuntsA = (other.diet === 'CARNIVORE' && (c.diet === 'HERBIVORE' || c.diet === 'OMNIVORE')) || 
                    (other.diet === 'OMNIVORE' && other.hunger < 40 && (c.diet === 'HERBIVORE' || c.diet === 'CARNIVORE'))
    
    if (bHuntsA) {
      const dx = other.x - c.x
      const dy = other.y - c.y
      const dSq = dx * dx + dy * dy
      if (dSq < fleeRadiusSq && dSq < closestDistSq) {
        closestDistSq = dSq
        closestTargetX = other.x
        closestTargetY = other.y
        closestTargetId = other.id
        targetType = 'FLEE'
      }
    }
  }

  // 2. Check Hunting Meat
  if (targetType !== 'FLEE' && c.hunger < 80) {
    for (let j = 0; j < world.creatures.length; j++) {
      const other = world.creatures[j]
      if (c.id === other.id || world.scratchpad.deletedCreatureIds.has(other.id)) continue
      
      const aHuntsB = (c.diet === 'CARNIVORE' && (other.diet === 'HERBIVORE' || other.diet === 'OMNIVORE')) || 
                      (c.diet === 'OMNIVORE' && c.hunger < 40 && (other.diet === 'HERBIVORE' || other.diet === 'CARNIVORE'))
      
      if (aHuntsB) {
        const dx = other.x - c.x
        const dy = other.y - c.y
        const dSq = dx * dx + dy * dy
        if (dSq < sightSq && dSq < closestDistSq) {
          closestDistSq = dSq
          closestTargetX = other.x
          closestTargetY = other.y
          closestTargetId = other.id
          targetType = 'HUNTS_MEAT'
        }
      }
    }
  }

  // 3. Check Hunting Plants
  if (targetType !== 'FLEE' && !closestTargetId && (c.diet === 'HERBIVORE' || c.diet === 'OMNIVORE' || (c.diet === 'CARNIVORE' && c.hunger < 20))) {
    for (let k = 0; k < world.plants.length; k++) {
      const plant = world.plants[k]
      if (world.scratchpad.deletedPlantIds.has(plant.id)) continue;
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

  return {
    targetType,
    targetX: closestTargetX,
    targetY: closestTargetY,
    targetId: closestTargetId,
  }
}
