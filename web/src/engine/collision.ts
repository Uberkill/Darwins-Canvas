import type { WorldState } from '../types'
import { CARNIVORE_EAT_RANGE, HERBIVORE_EAT_RANGE } from '../constants'

/**
 * collision.ts — food-chain collision detection.
 * Includes real-time combat damage exchange.
 */

export function runCollision(world: WorldState, dt: number): void {
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

      // Z-Gate Hitbox: only allow combat if creatures are roughly at the same height
      if (Math.abs(a.z - b.z) > 30) continue

      const dx = a.x - b.x
      const dy = a.y - b.y
      const distSq = dx * dx + dy * dy

      // Check hostility
      const aHuntsB = (a.diet === 'CARNIVORE' && (b.diet === 'HERBIVORE' || b.diet === 'OMNIVORE')) || 
                      (a.diet === 'OMNIVORE' && a.hunger < 40 && (b.diet === 'HERBIVORE' || b.diet === 'CARNIVORE'))
      
      const bHuntsA = (b.diet === 'CARNIVORE' && (a.diet === 'HERBIVORE' || a.diet === 'OMNIVORE')) || 
                      (b.diet === 'OMNIVORE' && b.hunger < 40 && (a.diet === 'HERBIVORE' || a.diet === 'CARNIVORE'))

      if (aHuntsB || bHuntsA) {
        if (distSq < carnRangeSq) {
          // Combat happens!
          a.state = 'FIGHTING'
          b.state = 'FIGHTING'
          
          a.health -= b.damage * dt
          b.health -= a.damage * dt

          // Determine death
          if (a.health <= 0) {
            deletedCreatureIds.add(a.id)
            if (bHuntsA) {
              b.hunger = 100
              b.state = 'EATING'
              b.kills += 1
              b.bravery = Math.min(1.0, b.bravery + 0.1)
              b.currentScale = Math.min(2.0, b.currentScale + 0.05)
            }
          }
          if (b.health <= 0) {
            deletedCreatureIds.add(b.id)
            if (aHuntsB) {
              a.hunger = 100
              a.state = 'EATING'
              a.kills += 1
              a.bravery = Math.min(1.0, a.bravery + 0.1)
              a.currentScale = Math.min(2.0, a.currentScale + 0.05)
            }
          }
          if (a.health <= 0) break;
        }
      }
    }
  }

  // Feeding loop (Plants)
  for (const c of world.creatures) {
    if (deletedCreatureIds.has(c.id) || c.z > 20) continue

    if (c.diet === 'HERBIVORE' || c.diet === 'OMNIVORE' || (c.diet === 'CARNIVORE' && c.hunger < 20)) {
      for (const p of world.plants) {
        if (deletedPlantIds.has(p.id)) continue
        const dx = c.x - p.x
        const dy = c.y - p.y
        if (dx * dx + dy * dy < herbRangeSq) {
          deletedPlantIds.add(p.id)
          
          let plantEnergy = 15;
          if (p.growthStage >= 1.0) {
            plantEnergy = 100;
          } else if (p.growthStage >= 0.5) {
            plantEnergy = 40;
          }
          
          if (c.diet === 'CARNIVORE') {
            c.hunger = Math.min(30, c.hunger + plantEnergy * 0.1) // Carnivores get very little
          } else {
            c.hunger = Math.min(100, c.hunger + plantEnergy)
          }
          c.state = 'EATING'
          break
        }
      }
    }
  }

  // Process starvation deaths outside of combat
  for (const c of world.creatures) {
    if (c.health <= 0 && !deletedCreatureIds.has(c.id)) {
      deletedCreatureIds.add(c.id)
    }
  }

  // No return, sets are mutated in-place
}
