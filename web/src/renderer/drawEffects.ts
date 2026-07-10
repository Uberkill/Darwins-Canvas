import type { VisualEffect } from '../types';
import { CAMERA_TILT } from '../constants';

export function drawEffects(ctx: CanvasRenderingContext2D, visualEffects: VisualEffect[]) {
  if (!visualEffects || visualEffects.length === 0) return;

  for (const effect of visualEffects) {
    if (effect.type === 'LIGHTNING') {
      ctx.save();
      // Fade out based on timer
      const alpha = Math.max(0, effect.timer / effect.maxTimer);
      ctx.strokeStyle = `rgba(255, 255, 100, ${alpha})`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Seeded random for consistent jaggedness per effect
      let seed = effect.seed;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      ctx.beginPath();
      // Start from sky (far above)
      let currentX = effect.x + (random() - 0.5) * 100;
      const targetY = effect.y * CAMERA_TILT;
      let currentY = targetY - 1000;
      ctx.moveTo(currentX, currentY);

      // Draw jagged line down to target
      while (currentY < targetY) {
        currentY += 50 + random() * 50;
        if (currentY > targetY) currentY = targetY;
        currentX += (random() - 0.5) * 80;
        if (currentY === targetY) currentX = effect.x; // Ensure it hits the target exactly
        ctx.lineTo(currentX, currentY);
      }
      ctx.stroke();

      // Flash core
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      
      ctx.restore();
    } else if (effect.type === 'HEAL') {
      ctx.save();
      const progress = 1.0 - (effect.timer / effect.maxTimer); // 0 to 1
      const alpha = Math.max(0, effect.timer / effect.maxTimer);
      
      // Floating green crosses
      ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
      
      let seed = effect.seed;
      const random = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
      };

      for (let i = 0; i < 5; i++) {
        const rx = (random() - 0.5) * 60;
        const ry = (random() - 0.5) * 40;
        const rise = progress * (50 + random() * 50);
        
        const px = effect.x + rx;
        const py = (effect.y * CAMERA_TILT) - 20 + ry - rise;
        
        const size = 4 + random() * 6;
        
        ctx.beginPath();
        // Draw a plus sign (+)
        ctx.rect(px - size/2, py - size/6, size, size/3);
        ctx.rect(px - size/6, py - size/2, size/3, size);
        ctx.fill();
      }
      ctx.restore();
    } else if (effect.type === 'SPAWN') {
      ctx.save();
      const alpha = Math.max(0, effect.timer / effect.maxTimer); // 1.0 to 0.0
      
      // Pillar of Light from sky down to spawn point
      const targetY = effect.y * CAMERA_TILT;
      const topY = targetY - 3000;
      const gradient = ctx.createLinearGradient(effect.x, topY, effect.x, targetY);
      gradient.addColorStop(0, `rgba(255, 255, 200, 0)`);
      gradient.addColorStop(0.5, `rgba(255, 255, 220, ${alpha * 0.6})`);
      gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha})`);

      ctx.fillStyle = gradient;
      
      const widthTop = 200 * alpha;
      const widthBottom = 60 * alpha;
      
      ctx.beginPath();
      ctx.moveTo(effect.x - widthTop, topY);
      ctx.lineTo(effect.x + widthTop, topY);
      ctx.lineTo(effect.x + widthBottom, targetY);
      ctx.lineTo(effect.x - widthBottom, targetY);
      ctx.fill();

      // Shockwave ring on the ground
      const progress = 1.0 - alpha; // 0.0 to 1.0
      const radius = progress * 150;
      ctx.beginPath();
      ctx.ellipse(effect.x, targetY, radius, radius * 0.35 * CAMERA_TILT, 0, 0, Math.PI * 2);
      ctx.lineWidth = 4 * alpha;
      ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.stroke();

      ctx.restore();
    }
  }
}
