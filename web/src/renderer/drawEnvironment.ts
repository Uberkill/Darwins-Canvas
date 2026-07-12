import type { WorldState } from '../types';
import { CAMERA_TILT } from '../constants';

export function drawEnvironment(ctx: CanvasRenderingContext2D, world: Readonly<WorldState>) {
  const { worldWidth, worldHeight, totalTime, weather } = world;

  // Draw Weather Overlay (Rain / Drought)
  const visibleHeight = worldHeight * CAMERA_TILT;
  if (weather === 'RAIN') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Create a scrolling rain effect using totalTime
    const dropCount = 100;
    for (let i = 0; i < dropCount; i++) {
      const x = (i * 20 + totalTime * 100) % worldWidth;
      const y = (i * 30 + totalTime * 400) % visibleHeight;
      ctx.moveTo(x, y);
      ctx.lineTo(x - 5, y + 15); // slanted drops
    }
    ctx.stroke();
    ctx.restore();
  } else if (weather === 'DROUGHT') {
    // Light sepia/orange overlay for drought
    ctx.fillStyle = 'rgba(211, 84, 0, 0.1)';
    ctx.fillRect(0, 0, worldWidth, visibleHeight);
  }

  // Day/Night overlay moved to Renderer.ts lightingCanvas pass (see draw() step 2)
}
