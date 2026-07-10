import type { Creature } from '../types'
import { BASE_RENDER_SIZE, CAMERA_TILT, DEPTH_SCALE_FAR, DEPTH_SCALE_NEAR, SHADOW_OFFSET_X, SHADOW_OFFSET_Y } from '../constants'
import { getImage } from './imageCache'

import { getDepthScale, getSpawnOffsetY, getWobbleRotation, getSquashStretch, getBreatheScale, getProjectedY, getBossAuraRadius } from './math2_5d'

/**
 * drawCreature.ts — renders a single creature on the canvas.
 *
 * Rendering features:
 * - Bottom-anchored: creature.y is the ground contact point
 * - Depth Scale: creature.y drives visual scale (far=smaller, near=larger)
 * - Wobble rotation (±5° when MOVING, based on direction)
 * - Squash/stretch (hoppers: stretch ascending, squash landing)
 * - Breathing idle animation: gentle ±2.5% scale pulse using creature.age
 * - Ground shadow (see drawCreatureShadow — called separately before this)
 * - try/catch fallback: coloured circle if image fails/hasn't loaded
 *
 * Transparent PNG: the drawingData PNG has a transparent background (no white
 * fill). Only pixels the user drew are visible. The ecosystem sky/ground
 * shows through undrawn areas — creatures look like actual creatures.
 */
export function drawCreature(ctx: CanvasRenderingContext2D, creature: Creature, worldHeight: number = 900): void {
  // Visual size is based on currentScale (which grows from 0.5 to 1.5)
  // We keep the hitbox separate.
  const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0)

  // ── Depth Scale (perspective illusion) ──
  // Far creatures (top of map) are smaller; near creatures (bottom) are larger.
  const depthScale = getDepthScale(creature.y, worldHeight);

  const spawnOffsetY = getSpawnOffsetY(creature.age);

  ctx.save()
  // 2.5D Projection: squish Y according to tilt, but keep Z fully un-squished (jumping)
  ctx.translate(creature.x, getProjectedY(creature.y, creature.z, CAMERA_TILT, spawnOffsetY));

  // Apply depth scale — scales entire drawing context around the anchor point
  ctx.scale(depthScale, depthScale);

  // ── Wobble rotation ──
  ctx.rotate(getWobbleRotation(creature.state, creature.direction.vx));

  // ── Squash / Stretch (hoppers only) ──
  let { scaleX, scaleY } = getSquashStretch(creature.movement, creature.state, creature.hopPhase || 0);

  // ── Breathing idle animation ──
  const breathe = getBreatheScale(creature.age);
  scaleX *= breathe;
  scaleY *= breathe;

  // Flip horizontally if moving left (assuming drawn facing right)
  if (creature.direction.vx < 0) {
    scaleX *= -1;
  }

  ctx.scale(scaleX, scaleY);
  
  // ── Determine Animated State ──
  let frameState: 'IDLE' | 'SLEEPING' | 'EATING' | 'FIGHTING' = 'IDLE'
  if (creature.behavior === ('SLEEPING' as any)) {
    frameState = 'SLEEPING'
  } else if (creature.state === 'EATING' || creature.eatingTimer > 0 || creature.lungeTimer > 0) {
    frameState = 'EATING'
  } else if (creature.state === 'FIGHTING') {
    frameState = 'FIGHTING'
  }

  const base64Src = creature.bakedSprites ? creature.bakedSprites[frameState] : creature.drawingData
  const imgId = creature.bakedSprites ? `${creature.id}_${frameState}` : creature.id

  // ── Draw creature image (bottom-anchored: top-left at -size/2, -size) ──
  try {
    const img = getImage(imgId, base64Src)
    if (img.complete && img.naturalWidth > 0) {
      const isElderly = creature.age > creature.maxAge * 0.8;
      if (isElderly) {
        ctx.filter = 'contrast(0.8) brightness(1.2)';
      }
      if (creature.hitTimer && creature.hitTimer > 0) {
        const shakeX = (Math.random() - 0.5) * 2;
        const shakeY = (Math.random() - 0.5) * 2;
        ctx.translate(shakeX, shakeY);
      }
      
      // Boss Aura for Level 5+ creatures
      if (creature.level >= 5) {
        const age = creature.age || 0;
        const pulse = 0.5 + 0.5 * Math.sin(age * 3);
        
        const radius = getBossAuraRadius(creature.level, age, size);
        if (radius > 0) {
          let glowColor = `rgba(255, 215, 0, ${0.3 + 0.2 * (0.5 + 0.5 * Math.sin(age * 3))})`; // Gold for Omnivore
          if (creature.diet === 'CARNIVORE') glowColor = `rgba(255, 50, 50, ${0.3 + 0.2 * (0.5 + 0.5 * Math.sin(age * 3))})`;
          else if (creature.diet === 'HERBIVORE') glowColor = `rgba(50, 255, 50, ${0.3 + 0.2 * (0.5 + 0.5 * Math.sin(age * 3))})`;
          
          ctx.beginPath();
          ctx.arc(0, -size / 2, radius, 0, Math.PI * 2);
          
          // Gradient is highly performant and achieves the same blurred glow
          const gradient = ctx.createRadialGradient(0, -size / 2, radius * 0.5, 0, -size / 2, radius);
          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      }

      ctx.drawImage(img, -size / 2, -size, size, size)
      
      if (isElderly) {
        ctx.filter = 'none'; // reset filter immediately
      }
    } else {
      drawFallback(ctx, size, creature)
    }
  } catch {
    drawFallback(ctx, size, creature)
  }

  ctx.restore()
}

/**
 * drawCreatureShadow — renders the directional ground shadow BEFORE the creature.
 *
 * Shadow is offset in the direction of the DST "sun from upper-left", making it
 * visually clear that creatures are standing on a 3D ground plane.
 * Shadow also uses depth scale: far shadows are smaller (matching smaller creature).
 * Shadow fades and shrinks as the creature rises above the ground (hoppers).
 */
export function drawCreatureShadow(ctx: CanvasRenderingContext2D, creature: Creature, worldHeight: number = 900): void {
  const size        = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0)
  let z             = creature.z  // elevation

  // ── Spawn Drop Animation ──
  if (creature.age < 0.4) {
    const t = creature.age / 0.4;
    const n1 = 7.5625;
    const d1 = 2.75;
    let bounce = 0;
    if (t < 1 / d1) bounce = n1 * t * t;
    else if (t < 2 / d1) { const t2 = t - 1.5 / d1; bounce = n1 * t2 * t2 + 0.75; }
    else if (t < 2.5 / d1) { const t2 = t - 2.25 / d1; bounce = n1 * t2 * t2 + 0.9375; }
    else { const t2 = t - 2.625 / d1; bounce = n1 * t2 * t2 + 0.984375; }
    z += (1 - bounce) * 600; // Add to Z so shadow scales naturally during drop
  }

  const alpha   = Math.max(0, 0.28 - z * 0.004)
  if (alpha <= 0.005) return  // too faint to bother drawing

  // Depth scale: shadow matches visual creature size
  const depthScale = getDepthScale(creature.y, worldHeight);
  const scaleX  = Math.max(0.35, 1 - z * 0.012)

  ctx.save()
  // 2.5D Projection: ground shadow anchors to the tilted floor,
  // then offset in the sun direction (SHADOW_OFFSET) for the DST directional look.
  ctx.translate(
    creature.x + SHADOW_OFFSET_X * depthScale,
    creature.y * CAMERA_TILT + SHADOW_OFFSET_Y * depthScale
  )
  ctx.scale(scaleX * depthScale, depthScale)
  ctx.fillStyle = `rgba(40, 32, 20, ${alpha.toFixed(3)})`
  ctx.beginPath()
  // Wider, more elongated ellipse to sell the flat-ground-plane look
  ctx.ellipse(0, 2, size * 0.42, size * 0.09, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

/** Fallback: coloured circle when image fails — render loop never crashes. */
function drawFallback(ctx: CanvasRenderingContext2D, size: number, creature: Creature): void {
  const colors: Record<string, string> = {
    HERBIVORE: '#8ab868',
    CARNIVORE: '#e07070',
  }
  ctx.beginPath()
  ctx.arc(0, -size / 2, size / 2, 0, Math.PI * 2)
  ctx.fillStyle = colors[creature.diet] ?? '#c8a882'
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1.5
  ctx.stroke()
}

/**
 * drawTrackingMarker — renders the visual crosshair/diamond above a tracked creature.
 * Called in Pass 2 of the renderer to ensure it floats above all sprites.
 */
export function drawTrackingMarker(ctx: CanvasRenderingContext2D, creature: Creature, timestamp: number, worldHeight: number = 900): void {
  const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0);
  const depthScale = getDepthScale(creature.y, worldHeight);
  
  ctx.save();
  // Anchor to creature's head (True 2.5D projection + depth scale)
  ctx.translate(creature.x, (creature.y * CAMERA_TILT) - creature.z - size * depthScale - 20);
  
  // Pulse animation using timestamp (O(1) CPU, no React state)
  const pulse = Math.sin(timestamp / 200);
  const scale = (1 + pulse * 0.15) * depthScale;
  ctx.scale(scale, scale);
  
  // Draw glowing diamond
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(10, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-10, 0);
  ctx.closePath();
  
  ctx.fillStyle = '#FF6B9E'; // primary pink
  ctx.shadowColor = '#FF6B9E';
  ctx.shadowBlur = 10;
  ctx.fill();
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'white';
  ctx.stroke();
  
  ctx.restore();
}

