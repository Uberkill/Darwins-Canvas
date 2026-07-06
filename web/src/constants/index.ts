import type { CreatureSize } from '../types';

// ─── World dimensions (functions — safe across resize/orientation changes) ────
export const getWorldWidth  = (): number => window.innerWidth;
export const getWorldHeight = (): number => window.innerHeight;

// ─── Creature base render size ────────────────────────────────────────────────
// MEDIUM creature renders at 80×80 px in the ecosystem.
// SMALL = 40×40 px (renderScale 0.5) | LARGE = 160×160 px (renderScale 2.0)
export const BASE_RENDER_SIZE = 80; // px

// ─── Creature stats by size ───────────────────────────────────────────────────
export const BASE_SPEED        = 80;  // px/second for MEDIUM
export const STARTING_HUNGER   = 80;  // all creatures start at 80%

export const SIZE_STATS: Record<CreatureSize, {
  speedMultiplier:       number;
  hungerDrainMultiplier: number;
  renderScale:           number;
  healthMultiplier:      number;
  damageMultiplier:      number;
}> = {
  SMALL:  { speedMultiplier: 2.0, hungerDrainMultiplier: 0.5, renderScale: 0.5, healthMultiplier: 0.5, damageMultiplier: 0.5 },
  MEDIUM: { speedMultiplier: 1.0, hungerDrainMultiplier: 1.0, renderScale: 1.0, healthMultiplier: 1.0, damageMultiplier: 1.0 },
  LARGE:  { speedMultiplier: 0.5, hungerDrainMultiplier: 2.0, renderScale: 2.0, healthMultiplier: 2.0, damageMultiplier: 2.0 },
};

// ─── Diet-Specific Tuning ─────────────────────────────────────────────────────
export const HERBIVORE_BASE_HUNGER_DRAIN = 2.5; // 40 seconds to starve
export const CARNIVORE_BASE_HUNGER_DRAIN = 3.5; // ~28 seconds to starve
export const OMNIVORE_BASE_HUNGER_DRAIN  = 3.0; 

// ─── Health & Combat Stats ────────────────────────────────────────────────────
export const BASE_HEALTH = 100;
export const PASSIVE_HEAL_RATE = 10.0; // HP/sec regenerated if hunger > 80
export const STARVATION_DAMAGE = 5.0; // HP/sec lost if hunger <= 0

export const HERBIVORE_BASE_DAMAGE = 2.0;  // Weak
export const OMNIVORE_BASE_DAMAGE  = 20.0; // Moderate
export const CARNIVORE_BASE_DAMAGE = 30.0; // High

// Exhaustion multipliers applied during specific BehaviorStates
export const FLEEING_HUNGER_MULTIPLIER = 1.0; // Handled by Stamina now
export const HUNTING_HUNGER_MULTIPLIER = 1.0;

// ─── Population limits ────────────────────────────────────────────────────────
export const GLOBAL_POPULATION_CAP    = 50;
export const CARNIVORE_POPULATION_CAP = 5;

// ─── Plant constants ──────────────────────────────────────────────────────────
export const PLANT_CAP          = 40;   // max plants on screen at once
export const PLANT_SPAWN_RATE   = 1.5;  // seconds between spawns
export const PLANT_GROWTH_RATE  = 0.4;  // growthStage increase per second (0→1 in ~2.5s)
export const PLANT_WOBBLE_SPEED = 1.2;  // radians/second for organic sway

// ─── Collision & Senses ───────────────────────────────────────────────────────
export const CARNIVORE_EAT_RANGE = 35;  // px
export const HERBIVORE_EAT_RANGE = 25;  // px
export const SIGHT_RADIUS        = 400; // px
export const MAX_STEERING_FORCE  = 120; // max velocity change per second

// ─── Reproduction ─────────────────────────────────────────────────────────────
export const HERBIVORE_REPRO_THRESHOLD = 60;
export const HERBIVORE_REPRO_COOLDOWN  = 15; 
export const CARNIVORE_REPRO_THRESHOLD = 75;
export const CARNIVORE_REPRO_COOLDOWN  = 45;

export const REPRO_CHANCE_PER_SEC   = 0.008; // ~0.8% chance per eligible second
export const REPRO_SPAWN_OFFSET     = 65;    // px away from parent

// ─── Hopper movement ──────────────────────────────────────────────────────────
export const HOP_HEIGHT         = 80;   // max Z elevation in px (upward)
export const HOP_SPEED          = 3.5;  // radians/second for sine wave
export const HOP_PAUSE_DURATION = 0.5;  // seconds between hops

// ─── Pacer movement ───────────────────────────────────────────────────────────
export const PACER_MOVE_DURATION  = 1.5; // seconds of burst
export const PACER_PAUSE_DURATION = 2.0; // seconds of pause

export const EMPTY_STATE_DELAY_MS   = 3000; // ms before showing empty-state tooltip

// ─── Stamina & Combat Dynamics ───────────────────────────────────────────────
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_RATE = 20; // 5 seconds of sprinting
export const STAMINA_REGEN_RATE = 10; // 10 seconds to recover fully
export const EXHAUSTION_SPEED_PENALTY = 0.5; // 50% slower when stamina is 0

export const LUNGE_DURATION = 1.5; // seconds
export const LUNGE_COOLDOWN = 4.0; // seconds
export const LUNGE_SPEED_MULTIPLIER = 1.5; // 50% faster

// ─── Macro Systems (Day/Night & Weather) ─────────────────────────────────────
export const DAY_NIGHT_CYCLE_DURATION = 60; // 60 real seconds for a full 24h cycle
export const NIGHT_SIGHT_PENALTY = 0.4; // 60% reduction in sight radius

export const WEATHER_CYCLE_DURATION = 120; // 120 seconds per weather shift
export const RAIN_PLANT_SPAWN_MULTIPLIER = 2.0; // 2x plants
export const DROUGHT_PLANT_SPAWN_MULTIPLIER = 0.5; // half plants
