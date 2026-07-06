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

// ─── CRAWLER ─────────────────────────────────────────────────────────────────
// Moves continuously in 2D space. Bounces off 4 walls.

export function moveCrawler(creature: Creature, dt: number, worldWidth: number, worldHeight: number): void {
  const radius = (BASE_RENDER_SIZE * creature.renderScale) / 2
  let moveX = creature.speed * creature.direction.vx * dt
  let moveY = creature.speed * creature.direction.vy * dt
  const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
  if (stepDist > radius) {
    moveX = (moveX / stepDist) * radius
    moveY = (moveY / stepDist) * radius
  }
  creature.x += moveX
  creature.y += moveY
  creature.state = 'MOVING'

  // Boundary flip — clamp position to prevent overshoot (4 walls)
  if (creature.x < radius) {
    creature.x = radius
    if (creature.direction.vx < 0) creature.direction.vx *= -1
  } else if (creature.x > worldWidth - radius) {
    creature.x = worldWidth - radius
    if (creature.direction.vx > 0) creature.direction.vx *= -1
  }

  if (creature.y < radius) {
    creature.y = radius
    if (creature.direction.vy < 0) creature.direction.vy *= -1
  } else if (creature.y > worldHeight - radius) {
    creature.y = worldHeight - radius
    if (creature.direction.vy > 0) creature.direction.vy *= -1
  }
}

// ─── HOPPER ──────────────────────────────────────────────────────────────────
// Moves in 2D space while applying a sine-wave Z offset.
// Pauses briefly between each hop cycle.

export function moveHopper(creature: Creature, dt: number, worldWidth: number, worldHeight: number): void {
  // Adrenaline Rush: Never pause when running for life or hunting!
  const isAdrenaline = creature.behavior === 'FLEEING' || (creature.behavior === 'FORAGING' && creature.diet !== 'HERBIVORE')
  if (isAdrenaline) creature.hopPauseTimer = 0

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
  const radius = (BASE_RENDER_SIZE * creature.renderScale) / 2
  let moveX = creature.speed * creature.direction.vx * dt
  let moveY = creature.speed * creature.direction.vy * dt
  const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
  if (stepDist > radius) {
    moveX = (moveX / stepDist) * radius
    moveY = (moveY / stepDist) * radius
  }
  creature.x += moveX
  creature.y += moveY

  // Boundary flip
  if (creature.x < radius) {
    creature.x = radius
    if (creature.direction.vx < 0) creature.direction.vx *= -1
  } else if (creature.x > worldWidth - radius) {
    creature.x = worldWidth - radius
    if (creature.direction.vx > 0) creature.direction.vx *= -1
  }

  if (creature.y < radius) {
    creature.y = radius
    if (creature.direction.vy < 0) creature.direction.vy *= -1
  } else if (creature.y > worldHeight - radius) {
    creature.y = worldHeight - radius
    if (creature.direction.vy > 0) creature.direction.vy *= -1
  }

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
      const angle = Math.random() * Math.PI * 2
      creature.direction.vx = Math.cos(angle)
      creature.direction.vy = Math.sin(angle)
      creature.pacerPaused    = false
      creature.pacerMoveTimer = PACER_MOVE_DURATION
    }
  } else {
    // ── Burst phase ──
    const radius = (BASE_RENDER_SIZE * creature.renderScale) / 2
    let moveX = creature.speed * creature.direction.vx * dt
    let moveY = creature.speed * creature.direction.vy * dt
    const stepDist = Math.sqrt(moveX*moveX + moveY*moveY) || 1
    if (stepDist > radius) {
      moveX = (moveX / stepDist) * radius
      moveY = (moveY / stepDist) * radius
    }
    creature.x += moveX
    creature.y += moveY
    creature.state = 'MOVING'
    creature.pacerMoveTimer -= dt

    // Boundary flip
    if (creature.x < radius) {
      creature.x = radius
      if (creature.direction.vx < 0) creature.direction.vx *= -1
    } else if (creature.x > worldWidth - radius) {
      creature.x = worldWidth - radius
      if (creature.direction.vx > 0) creature.direction.vx *= -1
    }

    if (creature.y < radius) {
      creature.y = radius
      if (creature.direction.vy < 0) creature.direction.vy *= -1
    } else if (creature.y > worldHeight - radius) {
      creature.y = worldHeight - radius
      if (creature.direction.vy > 0) creature.direction.vy *= -1
    }

    if (creature.pacerMoveTimer <= 0 && !isAdrenaline) {
      // Enter pause phase
      creature.pacerPaused     = true
      creature.pacerPauseTimer = PACER_PAUSE_DURATION
    }
  }
}
