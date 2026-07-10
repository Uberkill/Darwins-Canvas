import type { Plant } from '../types'
import { CAMERA_TILT, DEPTH_SCALE_FAR, DEPTH_SCALE_NEAR } from '../constants'

/**
 * drawPlant.ts - renders a single plant/meat item on the canvas.
 *
 * Uses a minimalist "peblet" circle design.
 * growthStage (0-1) drives the overall scale.
 * wobblePhase drives a gentle pulsating animation for organic life.
 * depthScale fakes perspective: plants at the top of the map appear smaller.
 */
export function drawPlant(ctx: CanvasRenderingContext2D, plant: Plant, worldHeight: number = 900): void {
  const isMeat = plant.type === 'MEAT';
  const scale = 0.5 + plant.growthStage * 0.5; // 0.5 -> 1.0 as it grows
  // Pulsating radius instead of rotation
  const pulse = Math.sin(plant.wobblePhase) * 1.5; 
  const baseRadius = isMeat ? 12 : 10;
  const radius = (baseRadius * scale) + pulse;

  // Depth scale: plants near the top (y≈0) appear smaller than near (y≈worldHeight)
  const t = Math.max(0, Math.min(1, plant.y / worldHeight));
  const depthScale = DEPTH_SCALE_FAR + (DEPTH_SCALE_NEAR - DEPTH_SCALE_FAR) * t;

  ctx.save();
  // 2.5D projection: plants sit on the tilted floor
  ctx.translate(plant.x, plant.y * CAMERA_TILT);
  ctx.scale(depthScale, depthScale);

  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1, radius), 0, Math.PI * 2);
  
  if (isMeat) {
    ctx.fillStyle = '#E63946'; // Red meat
    ctx.strokeStyle = '#9e1a24';
  } else {
    ctx.fillStyle = '#7a9e5a'; // Green plant
    ctx.strokeStyle = '#5a7a40';
  }
  
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();

  // Draw a small highlight to make it look like a pebble
  ctx.beginPath();
  ctx.arc(-radius * 0.3, -radius * 0.3, Math.max(1, radius * 0.2), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();

  ctx.restore();
}
