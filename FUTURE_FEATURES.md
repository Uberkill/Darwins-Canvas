# Future Features Blueprint: Darwin's Canvas

This document outlines the architectural implementation plan for the three major game design pillars we plan to introduce. It breaks down exactly how they will integrate with our existing React, Zustand, and Canvas/Boids ecosystem.

---

## Feature 1: Procedural Stats (Ink-Based Physics)
*Concept: A creature's physical drawing dictates its biological stats. Giant ink blobs become slow tanks; thin squiggles become fragile speedsters.*

### Architectural Plan
1. **The Pixel Analyzer (`drawingUtils.ts`):**
   - When the user finishes drawing in `CreationCanvas.tsx`, we will extract the raw `ImageData` array.
   - We will run a 2D loop to calculate two core metrics:
     - **Ink Volume (Mass):** Total number of non-transparent pixels.
     - **Bounding Box Ratio (Aerodynamics):** The `width / height` of the drawn pixels.
2. **Stat Generation (`creatureFactory.ts`):**
   - We will replace the manual UI sliders (Speed, Health, etc.) with a `calculateStatsFromInk()` function.
   - **Mass Formula:** High Ink Volume = +300% `maxHealth`, -50% `speed`, +50% `hungerDrainRate`.
   - **Aerodynamic Formula:** High width-to-height ratio (long, thin creatures) = +100% `speed`, -50% `maxHealth`.
   - **Sensory Formula:** Each Eye decal = +20px `sightRadius`. Each Mouth decal = +5 `damage`.
3. **UI Feedback:**
   - As the player draws, a real-time stat radar chart (using Recharts or simple SVG) will dynamically shift, showing them exactly how their strokes are affecting the creature's genetics in real-time.

---

## Feature 2: Interactive Evolution
*Concept: When a creature survives against all odds and hits Level 10, the game pauses and pulls the player back into the canvas to physically draw evolutionary upgrades onto it.*

### Architectural Plan
1. **The Evolution Trigger (`LifeSystem.ts`):**
   - Currently, leveling up just gives passive stat bumps. We will add a listener: `if (creature.level === 10 && !creature.hasEvolved)`.
   - This fires an event to `useEngineStore` to trigger a global UI alert: *"Species X has reached the apex! Click to evolve!"*
2. **The Evolution Canvas (`EvolutionModal.tsx`):**
   - We will create a specialized version of the Creation Canvas.
   - We load the creature's original `drawingData` (Base64 PNG) onto the canvas, but lock it so it cannot be erased. 
   - The player gets a small "Evolution DNA Budget" to draw on top of it (e.g., adding spikes, wings, or thicker legs).
3. **Genetic Hand-off (`reproduction.ts`):**
   - When saved, the new `drawingData` completely replaces the old one. 
   - We trigger `Renderer.ts` to re-bake the `IDLE/EATING/SLEEPING/FIGHTING` sprites.
   - Because `reproduction.ts` clones the parent's `drawingData`, all future babies of this creature will inherit the new spiked/winged drawing, effectively creating a permanent new sub-species in the terrarium!

---

## Feature 3: Paintable Terrain & Biomes
*Concept: God Tools include a Terrain Brush to paint rivers and thickets, directly affecting movement and AI.*

### Architectural Plan
1. **The Spatial Grid (`TerrainSystem.ts`):**
   - We cannot do per-pixel collision for 100 creatures every frame (performance suicide). 
   - Instead, we will divide the `worldWidth / worldHeight` into a low-resolution grid (e.g., 20x20 pixel cells) stored as a 1D `Uint8Array`.
   - `0 = Plain`, `1 = Water`, `2 = Thicket`.
2. **The Painting UI (`GodToolbar.tsx`):**
   - Add new God Tools: `BRUSH_WATER` and `BRUSH_THICKET`.
   - When the user drags the mouse on the terrarium, we map the `mouseX/Y` to the grid indices and update the `Uint8Array`.
   - `Renderer.ts` will draw the grid behind the creatures using a low-opacity tilemap or smoothed marching-squares algorithm.
3. **Physics Integration (`movement.ts` & `Thoughts.ts`):**
   - In `movement.ts`, we sample the terrain grid at `creature.x, creature.y`. 
   - **Water Logic:** If the cell is `1`, we multiply `creature.speed * 0.3`. (Water slows them down).
   - **Thicket Logic:** If the cell is `2`, the creature is "hidden". In `Thoughts.ts`, we add a check: if prey is inside a thicket, predators cannot target them unless the predator is *also* inside the same thicket cell. This creates stealth and ambush mechanics!
