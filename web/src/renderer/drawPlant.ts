import type { Plant } from '../types'

/**
 * drawPlant.ts — renders a single plant on the canvas.
 *
 * Plants use a sprout design: thin stem + two leaf ovals.
 * growthStage (0→1) drives the overall scale so plants appear to grow in.
 * wobblePhase drives a gentle ±3° sway for organic life.
 *
 * The plant is drawn bottom-anchored at (x, y) — i.e., the stem root sits at y.
 */
export function drawPlant(ctx: CanvasRenderingContext2D, plant: Plant): void {
  const scale = 0.3 + plant.growthStage * 0.7  // 0.3 → 1.0 as it grows
  const wobble = Math.sin(plant.wobblePhase) * (3 * Math.PI / 180) // ±3°

  ctx.save()
  ctx.translate(plant.x, plant.y)
  ctx.rotate(wobble)

  const stemH  = 22 * scale
  const stemW  = 2.5 * scale
  const leafW  = 10 * scale
  const leafH  = 6  * scale

  // ── Stem ──
  ctx.fillStyle = '#7a9e5a'
  ctx.beginPath()
  ctx.roundRect(-stemW / 2, -stemH, stemW, stemH, stemW / 2)
  ctx.fill()

  // ── Left leaf ──
  ctx.fillStyle = '#8ab868'
  ctx.save()
  ctx.translate(-stemW / 2, -stemH * 0.55)
  ctx.rotate(-35 * Math.PI / 180)
  ctx.beginPath()
  ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // ── Right leaf ──
  ctx.fillStyle = '#98c874'
  ctx.save()
  ctx.translate(stemW / 2, -stemH * 0.6)
  ctx.rotate(35 * Math.PI / 180)
  ctx.beginPath()
  ctx.ellipse(0, 0, leafW, leafH, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.restore()
}
