import type { Creature, WorldState } from '../../types'

export interface BoidsForces {
  sepX: number;
  sepY: number;
  alignX: number;
  alignY: number;
  cohX: number;
  cohY: number;
  boidCount: number;
}

export function calculateBoids(c: Creature, world: WorldState): BoidsForces {
  let sepX = 0, sepY = 0
  let alignX = 0, alignY = 0
  let cohX = 0, cohY = 0
  let boidCount = 0

  const sightSq = c.sightRadius * c.sightRadius

  if (c.diet === 'HERBIVORE') {
    for (let j = 0; j < world.creatures.length; j++) {
      const other = world.creatures[j]
      if (c.id === other.id || world.scratchpad.deletedCreatureIds.has(other.id)) continue
      if (other.id === world.draggedEntityId) continue
      if (other.diet !== 'HERBIVORE') continue

      let dx = c.x - other.x
      let dy = c.y - other.y
      
      // Math Safety: Avoid pure zero distances
      if (dx === 0 && dy === 0) { dx = 0.001; dy = 0.001; }
      
      const dSq = dx * dx + dy * dy

      if (dSq > 0 && dSq < sightSq) {
        const dist = Math.sqrt(dSq)
        // Separation triggers much closer
        if (dist < 40) {
          sepX += (dx / dist) / dist
          sepY += (dy / dist) / dist
        }
        
        // Alignment & Cohesion (Herding)
        alignX += other.direction.vx
        alignY += other.direction.vy
        cohX += other.x
        cohY += other.y
        boidCount++
      }
    }
  }

  // Safety: Don't normalize 0 vectors, handle count
  if (boidCount > 0) {
    alignX /= boidCount
    alignY /= boidCount
    cohX /= boidCount
    cohY /= boidCount

    // Cohesion is a vector from c to the center of mass
    let cx = cohX - c.x
    let cy = cohY - c.y
    const cMag = Math.sqrt(cx * cx + cy * cy) || 1
    cohX = cx / cMag
    cohY = cy / cMag
    
    // Alignment normalization
    const aMag = Math.sqrt(alignX * alignX + alignY * alignY) || 1
    alignX /= aMag
    alignY /= aMag
  }

  // Add intent if herding is dominant and we aren't fleeing
  if (c.mood !== 'SCARED' && boidCount > 3) {
    c.intent = 'Following the herd';
  }

  return { sepX, sepY, alignX, alignY, cohX, cohY, boidCount }
}
