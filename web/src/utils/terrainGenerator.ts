import { createNoise2D } from 'simplex-noise';

export type MapType = 'pangaea' | 'archipelago' | 'great-lakes' | 'chaos';

export class TerrainGenerator {
  /**
   * Asynchronously generates a procedural map yielding control to the UI thread
   * @param tw Terrain Width in cells
   * @param th Terrain Height in cells
   * @param mapType The preset algorithm to use
   * @param onProgress Callback to update the drafting UI
   * @param checkAbort Function that returns true if generation should be killed (e.g. window resized)
   */
  static async generateAsync(
    tw: number,
    th: number,
    mapType: MapType,
    onProgress: (terrain: Uint8Array, rowsDone: number) => void,
    checkAbort: () => boolean
  ): Promise<Uint8Array | null> {
    const terrain = new Uint8Array(tw * th);
    
    // For chaos, just do the fast Math.random loop synchronously
    if (mapType === 'chaos') {
      for (let i = 0; i < terrain.length; i++) {
        const r = Math.random();
        if (r < 0.1) terrain[i] = 0; // Water
        else if (r < 0.2) terrain[i] = 3; // Rock
        else if (r < 0.6) terrain[i] = 2; // Grass
        else terrain[i] = 1; // Dirt
      }
      return terrain;
    }

    const noise2D = createNoise2D(); // Randomly seeded on call
    
    // Yield every Y chunk to avoid blocking main thread
    const CHUNK_SIZE = 4; 
    
    const centerX = tw / 2;
    const centerY = th / 2;
    const maxDist = Math.min(centerX, centerY);

    for (let y = 0; y < th; y++) {
      // Abort safely if user resizes window or cancels
      if (checkAbort()) return null;

      for (let x = 0; x < tw; x++) {
        const nx = x / tw;
        const ny = y / th;

        // Base noise (2 octaves for detailed topology)
        let noise = 1.0 * noise2D(nx * 3, ny * 3) + 
                    0.5 * noise2D(nx * 6, ny * 6);
        noise = noise / 1.5; // normalize roughly to -1 to 1
        
        // Convert to 0 to 1 range
        let elevation = (noise + 1) / 2;

        if (mapType === 'pangaea') {
          // Circular falloff - forces edges to be water
          const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          let falloff = dist / maxDist; // 0 at center, >1 at edges
          falloff = Math.pow(falloff, 2.5); // Steep exponential curve at coasts
          elevation = elevation - (falloff * 0.8);
        } else if (mapType === 'archipelago') {
          // Higher scale noise, lower global elevation to create islands
          let aNoise = 1.0 * noise2D(nx * 6, ny * 6) + 
                       0.5 * noise2D(nx * 12, ny * 12);
          aNoise = aNoise / 1.5;
          elevation = ((aNoise + 1) / 2) - 0.15;
        } else if (mapType === 'great-lakes') {
          // Normal noise, higher global elevation so only deep pockets are water
          elevation = elevation + 0.15;
        }

        // Map elevation to terrain type
        // 0=Water, 1=Dirt, 2=Grass, 3=Rock
        let type = 0;
        if (elevation < 0.35) {
          type = 0; // Water
        } else if (elevation < 0.45) {
          type = 1; // Dirt (Beaches)
        } else if (elevation < 0.75) {
          type = 2; // Grass (Forests/Plains)
        } else {
          type = 3; // Rock (Mountain Peaks)
        }

        terrain[y * tw + x] = type;
      }

      // Yield back to browser every few rows so React can animate loading spinners
      if (y % CHUNK_SIZE === 0) {
        onProgress(new Uint8Array(terrain), y + 1);
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    return terrain;
  }
}
