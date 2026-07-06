const fs = require('fs');
const path = 'C:\\\\Users\\\\oob\\\\.gemini\\\\antigravity\\\\scratch\\\\darwins-canvas\\\\web\\\\src\\\\engine\\\\simulate.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { moveCrawler, moveHopper, movePacer } from './movement'",
  "import { moveCrawler, moveHopper, movePacer } from './movement'\nimport { evaluateThoughts } from './ai/Thoughts'\nimport { calculateBoids } from './ai/Boids'"
);

const startMarker = "    // Accumulators for steering forces";
const endMarker = "    // Apply accumulated steering forces";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers!");
  process.exit(1);
}

const newLogic = `    // Carnivores get a 40% boost at night!
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
    if (boids.boidCount > 0) {
      const sepMag = Math.sqrt(boids.sepX*boids.sepX + boids.sepY*boids.sepY) || 1;
      accumulateForce((boids.sepX / sepMag) * MAX_STEERING_FORCE * 1.5, (boids.sepY / sepMag) * MAX_STEERING_FORCE * 1.5);
    }

    // 2. Fleeing / Foraging / Lure
    if (perception.targetId && perception.targetType) {
      let dX = c.x - perception.targetX;
      let dY = c.y - perception.targetY;
      if (dX === 0 && dY === 0) { dX = 0.1; dY = 0.1; }
      const dist = Math.sqrt(dX*dX + dY*dY) || 1;

      if (perception.targetType === 'FLEE') {
        const desiredX = dX / dist;
        const desiredY = dY / dist;
        const urgency = 1 - Math.min(1, dist / c.sightRadius);
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

`;

const newContent = content.substring(0, startIndex) + newLogic + content.substring(endIndex);
fs.writeFileSync(path, newContent);
console.log("Done");
