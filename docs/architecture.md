# Technical Architecture

Darwin's Canvas uses React, Vite, and HTML5 Canvas. It implements a strict 3-Tier Separation and a modular 7-Pillar physics engine to ensure 60FPS performance.

## 3-Tier Separation
1. **Data Layer (Zustand):** `useStore.ts` manages high-level UI state. It DOES NOT store raw simulation arrays to prevent React re-render flooding.
2. **Simulation Layer (Mutable Ref):** `worldRef.ts` holds the living arrays (`creatures`, `plants`). The game loop mutates these directly.
3. **Render Layer (HTML5 Canvas):** `Renderer.ts` reads from `worldRef` and draws entities to the DOM canvas. React has zero knowledge of the actual pixel positions of creatures.

## The 7-Pillar Physics Engine
The core simulation (`simulate.ts`) is strictly modularized into isolated systems:
1. **NavigationSystem.ts:** Sensory perception and Boids flocking AI (Separation, Alignment, Cohesion). Leverages `SpatialGrid` for O(1) performance.
2. **LifeSystem.ts:** Age, stamina, and hunger drain. Applies senescence (old age penalties).
3. **movement.ts:** Pure movement math (Crawler, Hopper, Pacer) and boundary checks.
4. **collision.ts:** Hit detection for feeding and physical Boids repulsion (push-back using dynamic bounding radii).
5. **reproduction.ts:** Tracks population caps and spawns offspring with mutations.
6. **spawner.ts:** Handles plant generation using `SpatialGrid` for O(1) empty-space checks.
7. **entityManager.ts:** Zero-GC deferred deletion (using `scratchpad.deletedCreatureIds` and `flushDeadEntities`).

## Presentation Layer (Audio & VFX)
- **VFX (Renderer.ts):** All visual effects (e.g., Pillar of Light spawn bounce, Lightning) are mathematical offsets applied strictly in `Renderer.ts` (e.g., using `ctx.translate()`). They NEVER mutate core physics (`creature.z` or `creature.y`).
- **Audio:** Split into `audioEngine.ts` (BGM Manager featuring a dual-deck DJ Crossfader for seamless day/night transitions without memory leaks) and `proceduralSfx.ts` (Web Audio API synthesis). No external audio files are loaded.

## Save / Load System
- Handled by `saveSystem.ts`.
- Serializes the entire `WorldState` to `localStorage` (excluding transient states like UI overlays).
- Contains robust versioning to migrate old saves.

## Performance Constraints
- NO React State for creature positions.
- NO heavy object instantiation inside the fixed loop. Use Zero-GC module-level scratch arrays or `world.scratchpad` to prevent heap allocations.
- USE `requestAnimationFrame` for all canvas mutations.
- Analytics loops MUST use rolling caps (e.g., 3600 points) to prevent runaway memory usage during long simulations.
