# Terrain System Architecture

This document tracks the technical implementation of the 2.5D visual upgrades and terrain generation.

## 1. Renderer (`Renderer.ts`)
* **2.5D Perspective**: Uses `CAMERA_TILT` to squash the Y-axis. Entities are depth-sorted linearly by Y coordinate to create fake 3D depth.
* **Lighting**: Day/Night cycle tracked via `world.timeOfDay`. Max darkness is clamped to `0.3` alpha to prevent color washout.
* **Atmosphere**: Utilizes low-opacity linear fog (`0.15`) and a radial vignette (`0.10`) for screen-space depth without heavy GPU blur operations.

## 2. Terrain Generation (`terrainGenerator.ts`)
* **Algorithm**: Uses `simplex-noise` for continuous geological maps.
* **Map Types**: 
  * Pangaea: Radial falloff forces edges to Water.
  * Archipelago: High scale noise + high water threshold.
  * Great Lakes: High elevation offsets.
  * Chaos: Pure random noise.
* **Execution**: Procedural generation is chunked asynchronously (`requestAnimationFrame`) to prevent the React UI thread from freezing.

## 3. Map Drawing (`WorldBuilder.tsx`)
* **Drafting**: Uses an offscreen `draftTerrainRef` to allow lag-free custom map painting before the user clicks "Apply Changes".
* **Safety**: Employs an Abort Controller (`generationId`) to safely kill async generation if the window resizes, and locks pointer events to prevent race conditions during procedural math.
