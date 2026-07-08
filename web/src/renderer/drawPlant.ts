import type { Plant } from '../types'

/**
 * drawPlant.ts - renders a single plant/meat item on the canvas.
 *
 * Uses a minimalist "peblet" circle design.
 * growthStage (0-1) drives the overall scale.
 * wobblePhase drives a gentle pulsating animation for organic life.
 */
export function drawPlant(ctx: CanvasRenderingContext2D, plant: Plant): void {
  const isMeat = plant.type === 'MEAT';
  const scale = 0.5 + plant.growthStage * 0.5; // 0.5 -> 1.0 as it grows
  // Pulsating radius instead of rotation
  const pulse = Math.sin(plant.wobblePhase) * 1.5; 
  const baseRadius = isMeat ? 12 : 10;
  const radius = (baseRadius * scale) + pulse;

  ctx.save();
  ctx.translate(plant.x, plant.y);

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
