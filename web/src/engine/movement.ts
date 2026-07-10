import { random } from './random';
import type { Creature } from '../types'
import {
  HOP_HEIGHT, HOP_SPEED, HOP_PAUSE_DURATION,
  PACER_MOVE_DURATION, PACER_PAUSE_DURATION,
  BASE_RENDER_SIZE,
} from '../constants'

/**
 * movement.ts — pure movement functions for each MovementType.
 *
 * All functions mutate the creature in place and return void.
 * They receive delta time in seconds so they are frame-rate independent.
 */

// Helper to strictly enforce wall boundaries based on dynamic scale
function applyWallBounds(creature: Creature, worldWidth: number, worldHeight: number, trueRadius: number): void {
  if (creature.x < trueRadius) {
    creature.x = trueRadius
    if (creature.direction.vx < 0) creature.direction.vx *= -1
  } else if (creature.x > worldWidth - trueRadius) {
    creature.x = worldWidth - trueRadius
    if (creature.direction.vx > 0) creature.direction.vx *= -1
  }

  if (creature.y < trueRadius) {
    creature.y = trueRadius
    if (creature.direction.vy < 0) creature.direction.vy *= -1
  } else if (creature.y > worldHeight - trueRadius) {
    creature.y = worldHeight - trueRadius
    if (creature.direction.vy > 0) creature.direction.vy *= -1
  }
}

// ─── CRAWLER ─────────────────────────────────────────────────────────────────
// Moves continuously in 2D space. Bounces off 4 walls.

export function moveCrawler(creature: Creature, dt: number, worldWidth: number, worldHeight: number): void {
  const trueRadius = (BASE_RENDER_SIZE * creature.renderScale * creature.currentScale) / 2
  let moveX = creature.speed * creature.direction.vx * dt
  let moveY = creature.speed * creature.direction.vy * dt
  const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
  if (stepDist > trueRadius) {
    moveX = (moveX / stepDist) * trueRadius
    moveY = (moveY / stepDist) * trueRadius
  }
  creature.x += moveX
  creature.y += moveY
  creature.state = 'MOVING'

  applyWallBounds(creature, worldWidth, worldHeight, trueRadius);
}

// ─── HOPPER ──────────────────────────────────────────────────────────────────
// Moves in 2D space while applying a sine-wave Z offset.
// Pauses briefly between each hop cycle.

export function moveHopper(creature: Creature, dt: number, worldWidth: number, worldHeight: number): void {
  // Adrenaline Rush: Reduce pause significantly, but never to 0 to ensure they can attack/be attacked on the ground.
  const isAdrenaline = creature.behavior === 'FLEEING' || (creature.behavior === 'FORAGING' && creature.diet !== 'HERBIVORE')
  if (isAdrenaline && creature.hopPauseTimer > 0.1) creature.hopPauseTimer = 0.1

  // If in between-hop pause, tick down and skip movement
  if (creature.hopPauseTimer > 0) {
    creature.hopPauseTimer -= dt
    creature.state = 'IDLE'
    creature.z = 0  // snap back to ground during pause
    return
  }

  // Advance the sine wave phase
  creature.hopPhase += HOP_SPEED * dt

  // Z offset — upward (elevation)
  creature.z = Math.abs(Math.sin(creature.hopPhase)) * HOP_HEIGHT

  // Classify as jumping when meaningfully off the ground
  creature.state = creature.z > 5 ? 'JUMPING' : 'MOVING'

  // X/Y movement
  const trueRadius = (BASE_RENDER_SIZE * creature.renderScale * creature.currentScale) / 2
  let moveX = creature.speed * creature.direction.vx * dt
  let moveY = creature.speed * creature.direction.vy * dt
  const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
  if (stepDist > trueRadius) {
    moveX = (moveX / stepDist) * trueRadius
    moveY = (moveY / stepDist) * trueRadius
  }
  creature.x += moveX
  creature.y += moveY

  applyWallBounds(creature, worldWidth, worldHeight, trueRadius);

  // After one full hop cycle (π radians = half sine), trigger pause
  if (creature.hopPhase >= Math.PI) {
    creature.hopPhase     = 0
    creature.hopPauseTimer = HOP_PAUSE_DURATION
  }
}

// ─── PACER ───────────────────────────────────────────────────────────────────
// Bursts of fast movement, followed by a full stop ("looking around"),
// then picks a new random 2D direction.

export function movePacer(creature: Creature, dt: number, worldWidth: number, worldHeight: number): void {
  // Adrenaline Rush: Never pause when running for life or hunting!
  const isAdrenaline = creature.behavior === 'FLEEING' || (creature.behavior === 'FORAGING' && creature.diet !== 'HERBIVORE')
  if (isAdrenaline) creature.pacerPaused = false

  if (creature.pacerPaused) {
    // ── Pause phase ──
    creature.pacerPauseTimer -= dt
    creature.state = 'PAUSED'

    if (creature.pacerPauseTimer <= 0) {
      // Resume: pick a random new 2D direction, start burst
      const angle = random() * Math.PI * 2
      creature.direction.vx = Math.cos(angle)
      creature.direction.vy = Math.sin(angle)
      creature.pacerPaused    = false
      creature.pacerMoveTimer = PACER_MOVE_DURATION
    }
  } else {
    // ── Burst phase ──
    const trueRadius = (BASE_RENDER_SIZE * creature.renderScale * creature.currentScale) / 2
    let moveX = creature.speed * creature.direction.vx * dt
    let moveY = creature.speed * creature.direction.vy * dt
    const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
    if (stepDist > trueRadius) {
      moveX = (moveX / stepDist) * trueRadius
      moveY = (moveY / stepDist) * trueRadius
    }
    creature.x += moveX
    creature.y += moveY
    creature.state = 'MOVING'
    creature.pacerMoveTimer -= dt

    applyWallBounds(creature, worldWidth, worldHeight, trueRadius);

    if (creature.pacerMoveTimer <= 0 && !isAdrenaline) {
      // Enter pause phase
      creature.pacerPaused     = true
      creature.pacerPauseTimer = PACER_PAUSE_DURATION
    }
  }
}
