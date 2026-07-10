import type { WorldState } from '../../types'
import { evaluateThoughts } from '../ai/Thoughts'
import { calculateBoids } from '../ai/Boids'
import { MAX_STEERING_FORCE } from '../../constants'

export const NavigationSystem = {
  update(world: WorldState, dt: number, globalSightPenalty: number) {
    for (let i = 0; i < world.creatures.length; i++) {
      const c = world.creatures[i]
      if (c.id === world.draggedEntityId) {
        c.direction.vx = 0
        c.direction.vy = 0
        continue
      }
      
      if (c.panicTimer > 0) {
        c.panicTimer = Math.max(0, c.panicTimer - dt)
      }

      c.behavior = c.panicTimer > 0 ? 'FLEEING' : 'WANDERING'
      c.targetId = null

      // Carnivores get a 40% boost at night!
      const sightMult = c.diet === 'CARNIVORE' && globalSightPenalty < 0.9 ? 1.4 : globalSightPenalty;
      c.sightRadius = c.baseStats.sightRadius * sightMult;

      const perception = evaluateThoughts(c, world, world.timeOfDay);
      const boids = calculateBoids(c, world);

      let forceX = 0;
      let forceY = 0;
      let remainingBudget = MAX_STEERING_FORCE;

      const accumulateForce = (fX: number, fY: number) => {
        if (remainingBudget <= 0) return;
        const mag = Math.sqrt(fX*fX + fY*fY) || 1;
        if (mag <= remainingBudget) {
          forceX += fX;
          forceY += fY;
          remainingBudget -= mag;
        } else {
          forceX += (fX / mag) * remainingBudget;
          forceY += (fY / mag) * remainingBudget;
          remainingBudget = 0;
        }
      };

      // 1. Separation (Highest Priority: don't crash into others)
      if (boids.sepX !== 0 || boids.sepY !== 0) {
        // We use the raw accumulated penetration vectors. 
        // Small overlaps = small force. Deep overlaps = massive force that eats the whole budget.
        accumulateForce(boids.sepX * MAX_STEERING_FORCE, boids.sepY * MAX_STEERING_FORCE);
      }

      // 2. Fleeing / Foraging / Lure
      if (perception.targetId && perception.targetType) {
        c.targetId = perception.targetId;
        if (perception.targetType === 'FLEE') {
          c.behavior = 'FLEEING';
          c.panicTimer = 3.0; // Stay panicked for 3 seconds even if sight is lost
        }
        else if (perception.targetType === 'LURE') c.behavior = 'WANDERING';
        else c.behavior = 'FORAGING';

        let dX = c.x - perception.targetX;
        let dY = c.y - perception.targetY;
        if (dX === 0 && dY === 0) { dX = 0.1; dY = 0.1; }
        const dist = Math.sqrt(dX*dX + dY*dY) || 1;

        if (perception.targetType === 'FLEE') {
          const desiredX = dX / dist;
          const desiredY = dY / dist;
          const urgency = 1 - Math.min(1, dist / Math.max(1, c.sightRadius));
          const applyForce = MAX_STEERING_FORCE * (0.5 + 0.5 * urgency) * 2.0;
          accumulateForce(desiredX * applyForce, desiredY * applyForce);
        } else {
          // FORAGE or LURE (seek)
          const desiredX = -dX / dist;
          const desiredY = -dY / dist;
          let force = MAX_STEERING_FORCE;
          if (perception.targetType === 'LURE') force = MAX_STEERING_FORCE * 2; // Strong lure pull
          accumulateForce(desiredX * force, desiredY * force);
        }
      }

      // 3. Herding: Alignment & Cohesion (Only if not fleeing!)
      if (c.mood !== 'SCARED' && boids.boidCount > 0) {
        accumulateForce(boids.alignX * MAX_STEERING_FORCE * 0.8, boids.alignY * MAX_STEERING_FORCE * 0.8);
        accumulateForce(boids.cohX * MAX_STEERING_FORCE * 0.5, boids.cohY * MAX_STEERING_FORCE * 0.5);
      }

      // 4. Wall Repulsion (Lowest Priority: gentle push away from edges)
      // This prevents creatures from stuttering/sticking against the world boundary.
      // The hard snap in applyWallBounds is a last resort; this keeps them from reaching it.
      const WALL_REPEL_DIST = 80; // px from edge where repulsion starts
      const wx = world.worldWidth;
      const wy = world.worldHeight;
      let wallX = 0, wallY = 0;
      if (c.x < WALL_REPEL_DIST)            wallX = +(1 - c.x / WALL_REPEL_DIST);
      if (c.x > wx - WALL_REPEL_DIST)       wallX = -(1 - (wx - c.x) / WALL_REPEL_DIST);
      if (c.y < WALL_REPEL_DIST)            wallY = +(1 - c.y / WALL_REPEL_DIST);
      if (c.y > wy - WALL_REPEL_DIST)       wallY = -(1 - (wy - c.y) / WALL_REPEL_DIST);
      if (wallX !== 0 || wallY !== 0) {
        accumulateForce(wallX * MAX_STEERING_FORCE * 0.6, wallY * MAX_STEERING_FORCE * 0.6);
      }

      // Apply accumulated steering forces

      if (forceX !== 0 || forceY !== 0) {
        c.direction.vx += forceX * dt
        c.direction.vy += forceY * dt
        const mag = Math.sqrt(c.direction.vx*c.direction.vx + c.direction.vy*c.direction.vy)
        if (mag === 0) {
          const angle = Math.random() * Math.PI * 2
          c.direction.vx = Math.cos(angle)
          c.direction.vy = Math.sin(angle)
        } else {
          c.direction.vx /= mag
          c.direction.vy /= mag
        }
      }
    }
  }
}
