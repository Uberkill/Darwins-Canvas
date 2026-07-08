import type { Creature } from '../types'
import { BASE_RENDER_SIZE } from '../constants'
import { getImage } from './imageCache'

/**
 * drawCreature.ts — renders a single creature on the canvas.
 *
 * Rendering features:
 * - Bottom-anchored: creature.y is the ground contact point
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
export function drawCreature(ctx: CanvasRenderingContext2D, creature: Creature): void {
  // Visual size is based on currentScale (which grows from 0.5 to 1.5)
  // We keep the hitbox separate.
  const size = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0)

  ctx.save()
  ctx.translate(creature.x, creature.y - creature.z)

  // ── Wobble rotation ──
  if (creature.state === 'MOVING') {
    // Determine visual flip based on velocity
    const isMovingRight = creature.direction.vx > 0
    const wobbleDir = isMovingRight ? 1 : -1
    const angle = (5 * Math.PI / 180) * wobbleDir
    ctx.rotate(angle)
  }

  // ── Squash / Stretch (hoppers only) ──
  let scaleX = 1
  let scaleY = 1
  if (creature.movement === 'HOPPER' && creature.state === 'JUMPING') {
    const ascending = creature.hopPhase < Math.PI / 2
    scaleY = ascending ? 1.3 : 0.75
    scaleX = ascending ? 0.85 : 1.2 // horizontal bulge when squashed
  }

  // ── Breathing idle animation ──
  // Uses creature.age as the phase — each creature breathes at its own rate
  // based on when it was born, so they don't all pulse in sync
  const breathe = 1 + Math.sin(creature.age * Math.PI) * 0.025 // ±2.5%, period ~2s
  scaleX *= breathe
  scaleY *= breathe

  // Flip horizontally if moving left (assuming drawn facing right)
  if (creature.direction.vx < 0) {
    scaleX *= -1
  }

  ctx.scale(scaleX, scaleY)
  
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
        
        // Protect against negative/NaN radius
        const radius = Math.max(0, size * 0.6 + size * 0.1 * pulse) || 0;
        if (radius > 0) {
          let glowColor = `rgba(255, 215, 0, ${0.3 + 0.2 * pulse})`; // Gold for Omnivore
          if (creature.diet === 'CARNIVORE') glowColor = `rgba(255, 50, 50, ${0.3 + 0.2 * pulse})`;
          else if (creature.diet === 'HERBIVORE') glowColor = `rgba(50, 255, 50, ${0.3 + 0.2 * pulse})`;
          
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
 * drawCreatureShadow — renders the ground contact shadow BEFORE the creature.
 * Call this in the render loop before drawCreature so the shadow appears
 * beneath the sprite.
 *
 * Shadow fades and shrinks as the creature rises above the ground (hoppers).
 */
export function drawCreatureShadow(ctx: CanvasRenderingContext2D, creature: Creature): void {
  const size        = BASE_RENDER_SIZE * creature.renderScale * (creature.currentScale || 1.0)
  const z           = creature.z  // elevation

  const alpha   = Math.max(0, 0.18 - z * 0.003)
  if (alpha <= 0.005) return  // too faint to bother drawing

  const scaleX  = Math.max(0.35, 1 - z * 0.012)

  ctx.save()
  ctx.translate(creature.x, creature.y)
  ctx.scale(scaleX, 1)
  ctx.fillStyle = `rgba(58, 50, 40, ${alpha.toFixed(3)})`
  ctx.beginPath()
  ctx.ellipse(0, 2, size * 0.38, size * 0.065, 0, 0, Math.PI * 2)
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
