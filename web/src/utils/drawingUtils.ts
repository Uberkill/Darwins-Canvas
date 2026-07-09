import type { Decal } from '../types'

export function applyBrushSettings(ctx: CanvasRenderingContext2D, size: number, color: string) {
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.lineWidth   = size
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
}

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/**
 * Iterative flood fill — BFS on physical pixel buffer.
 * Uses Uint8Array for visited tracking (fast, zero GC).
 * tolerance=30 handles anti-aliased stroke edges so fills don't leak.
 */
export function floodFill(
  data: Uint8ClampedArray,
  startX: number,
  startY: number,
  fr: number, fg: number, fb: number,
  width: number,
  height: number,
  tolerance = 30,
): void {
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return

  const startIdx = (startY * width + startX) * 4
  const tr = data[startIdx]
  const tg = data[startIdx + 1]
  const tb = data[startIdx + 2]
  const ta = data[startIdx + 3]

  // Don't fill if target is already the fill color
  if (tr === fr && tg === fg && tb === fb && ta === 255) return

  const visited = new Uint8Array(width * height)
  const stack: number[] = [startY * width + startX]

  while (stack.length > 0) {
    const pos = stack.pop()!
    if (visited[pos]) continue

    const x = pos % width
    const y = (pos / width) | 0
    const idx = pos * 4

    // Check if this pixel matches the target color within tolerance
    if (
      Math.abs(data[idx]     - tr) > tolerance ||
      Math.abs(data[idx + 1] - tg) > tolerance ||
      Math.abs(data[idx + 2] - tb) > tolerance ||
      Math.abs(data[idx + 3] - ta) > tolerance
    ) continue

    visited[pos] = 1
    data[idx]     = fr
    data[idx + 1] = fg
    data[idx + 2] = fb
    data[idx + 3] = 255  // fully opaque

    if (x > 0)           stack.push(pos - 1)
    if (x < width - 1)   stack.push(pos + 1)
    if (y > 0)           stack.push(pos - width)
    if (y < height - 1)  stack.push(pos + width)
  }

  // --- Dilation Pass (Anti-Aliasing Fix) ---
  const edges1 = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (visited[pos] === 1) {
        if (visited[pos - 1] === 0) edges1[pos - 1] = 1;
        if (visited[pos + 1] === 0) edges1[pos + 1] = 1;
        if (visited[pos - width] === 0) edges1[pos - width] = 1;
        if (visited[pos + width] === 0) edges1[pos + width] = 1;
        if (visited[pos - 1 - width] === 0) edges1[pos - 1 - width] = 1;
        if (visited[pos + 1 - width] === 0) edges1[pos + 1 - width] = 1;
        if (visited[pos - 1 + width] === 0) edges1[pos - 1 + width] = 1;
        if (visited[pos + 1 + width] === 0) edges1[pos + 1 + width] = 1;
      }
    }
  }
  
  const edges2 = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const pos = y * width + x;
      if (edges1[pos] === 1) {
        if (visited[pos - 1] === 0 && edges1[pos - 1] === 0) edges2[pos - 1] = 1;
        if (visited[pos + 1] === 0 && edges1[pos + 1] === 0) edges2[pos + 1] = 1;
        if (visited[pos - width] === 0 && edges1[pos - width] === 0) edges2[pos - width] = 1;
        if (visited[pos + width] === 0 && edges1[pos + width] === 0) edges2[pos + width] = 1;
      }
    }
  }

  // Composite the fill color UNDER the anti-aliased edge pixels
  for (let pos = 0; pos < width * height; pos++) {
    if (edges1[pos] === 1 || edges2[pos] === 1) {
       const idx = pos * 4;
       const tr = data[idx];
       const tg = data[idx+1];
       const tb = data[idx+2];
       const ta = data[idx+3];
       
       const alpha = ta / 255;
       data[idx]   = tr * alpha + fr * (1 - alpha);
       data[idx+1] = tg * alpha + fg * (1 - alpha);
       data[idx+2] = tb * alpha + fb * (1 - alpha);
       data[idx+3] = 255;
    }
  }
}

export function checkIsEmpty(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement
): boolean {
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 3; i < data.length; i += 4 * 17) {
    if (data[i] > 0) return false;
  }
  return true;
}

export function getPixelBounds(ctx: CanvasRenderingContext2D, width: number, height: number, decals: Decal[]) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width, minY = height, maxX = 0, maxY = 0;
  
  // Scan drawn pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Factor in decals
  for (const d of decals) {
    const half = d.scale / 2;
    if (d.x - half < minX) minX = d.x - half;
    if (d.x + half > maxX) maxX = d.x + half;
    if (d.y - half < minY) minY = d.y - half;
    if (d.y + half > maxY) maxY = d.y + half;
  }
  
  return { minX, minY, maxX, maxY };
}
