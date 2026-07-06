/**
 * imageCache.ts — pre-built HTMLImageElement cache for creature drawings.
 *
 * Problem solved: ctx.drawImage() cannot accept a raw base64 string — it
 * needs an HTMLImageElement. Creating `new Image()` on every frame per
 * creature allocates N × 60 objects/second, causing GC pauses and dropped frames.
 *
 * Solution: build the HTMLImageElement once when a creature is created,
 * store it here keyed by creature ID, and reuse it every frame.
 * On creature death, releaseImage() removes the entry.
 */

const cache = new Map<string, HTMLImageElement>()

/**
 * Returns the cached HTMLImageElement for a creature.
 * Creates and starts loading the image if not yet cached.
 */
export function getImage(id: string, drawingData: string): HTMLImageElement {
  if (cache.has(id)) return cache.get(id)!

  const img = new Image()
  img.src = drawingData
  cache.set(id, img)
  return img
}

/**
 * Pre-warms the cache for a creature before it enters the simulation.
 * Call this immediately on "Release" so the image is loaded before first render.
 */
export function preloadImage(id: string, drawingData: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()  // resolve even on error — fallback handles it
    img.src = drawingData
    cache.set(id, img)
  })
}

/**
 * Removes a creature's cached image when the creature dies.
 * Prevents the cache from growing unbounded over a long session.
 */
export function releaseImage(id: string): void {
  cache.delete(id)
}

/**
 * Generates a pre-tinted Data URL based on a hue shift and caches it.
 * Used for Genetics/Evolution to avoid per-frame ctx.filter bottlenecks.
 */
export async function generateTintedImage(id: string, originalData: string, hueShift: number): Promise<string> {
  // If no shift, just return original
  if (hueShift === 0) {
    await preloadImage(id, originalData);
    return originalData;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(originalData); // fallback
        return;
      }
      ctx.filter = `hue-rotate(${hueShift}deg)`;
      ctx.drawImage(img, 0, 0);
      
      const tintedData = canvas.toDataURL('image/png');
      
      const tintedImg = new Image();
      tintedImg.src = tintedData;
      cache.set(id, tintedImg);
      
      resolve(tintedData);
    };
    img.onerror = () => resolve(originalData);
    img.src = originalData;
  });
}


