# Technical Architecture

Darwin's Canvas is built with React, Vite, and HTML5 Canvas. It uses a strict 3-Tier Separation to ensure 60FPS performance and prevent complex logic from bleeding into UI components.

## 3-Tier Separation
1. **Data Layer (Zustand):** The `useStore.ts` manages high-level UI state (active tool, selected creature, panel states) but DOES NOT store the raw simulation arrays to prevent React re-render flooding. 
2. **Simulation Layer (Mutable Ref):** `worldRef.ts` holds the living arrays (`creatures`, `plants`). The game loop mutates these directly.
3. **Render Layer (HTML5 Canvas):** `Renderer.ts` reads from `worldRef` and draws entities to the DOM canvas. React has zero knowledge of the actual pixel positions of creatures.

## The Game Loop (`useGameLoop.ts`)
- Utilizes `requestAnimationFrame`.
- Enforces a **Fixed Timestep** (e.g. 16.66ms per tick) to ensure deterministic physics and logic regardless of monitor refresh rate.
- **Spiral of Death Prevention:** If the game lags or pauses, the `accumulator` caps at 250ms, preventing the engine from running thousands of catch-up ticks and freezing the browser.

## Spatial Grid (Broad-Phase Collision)
- To avoid O(n^2) distance checks, the world is divided into a `SpatialGrid` (`SpatialGrid.ts`).
- Cell size is currently set to `100x100`.
- Entities register their position every tick.
- When an entity searches for food/targets, it only queries its own cell and the 8 surrounding neighbor cells, dropping collision costs to O(1).

## Boids Algorithm (Flocking)
- Entities utilize a boids-inspired movement system (`boids.ts`) for organic flocking.
- **Separation:** Steer to avoid crowding flock-mates.
- **Alignment:** Steer towards the average heading of local flock-mates.
- **Cohesion:** Steer to move toward the average position of local flock-mates.
- **Wander:** A noise-based wandering vector is applied if no targets are found.

## Performance Constraints
- Do NOT use React State for creature positions.
- Do NOT use heavy object instantiation inside the fixed loop.
- Use `requestAnimationFrame` for all canvas mutations.
- UI Overlays (like the Tutorial) pause the simulation loop to free up the main thread for CSS animations.
