# Terrain System Architecture

This document tracks the technical implementation of the 2.5D visual upgrades and terrain generation.

## 1. Renderer (`Renderer.ts`)
The renderer uses a 2.5D perspective with `CAMERA_TILT` to squash the Y-axis, where entities are depth-sorted linearly by Y coordinate to create fake 3D depth.
For lighting, the Day/Night cycle is tracked via `world.timeOfDay`, and max darkness is clamped to `0.3` alpha to prevent color washout.
Atmosphere relies on low-opacity linear fog (`0.15`) and a radial vignette (`0.10`) for screen-space depth without heavy GPU blur operations.

## 2. Terrain Generation (`terrainGenerator.ts`)
The terrain generator runs on `simplex-noise` for continuous geological maps. 
Available map types include Pangaea (radial falloff forces edges to Water), Archipelago (high scale noise with a high water threshold), Great Lakes (high elevation offsets), and Chaos (pure random noise).
To maintain performance, procedural generation execution is chunked asynchronously using `requestAnimationFrame` to prevent the React UI thread from freezing.

## 3. Map Drawing (`WorldBuilder.tsx`)
Map drafting relies on an offscreen `draftTerrainRef` to allow lag-free custom map painting before the user clicks "Apply Changes".
Safety mechanisms include an Abort Controller (`generationId`) to safely kill async generation if the window resizes, and pointer event locks to prevent race conditions during procedural math.
