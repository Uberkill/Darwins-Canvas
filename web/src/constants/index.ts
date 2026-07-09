import type { CreatureSize } from '../types';

// ─── World dimensions (functions — safe across resize/orientation changes) ────
export const getWorldWidth  = (): number => window.innerWidth;
export const getWorldHeight = (): number => window.innerHeight;

// ─── Creature base render size ────────────────────────────────────────────────
// MEDIUM creature renders at 80×80 px in the ecosystem.
// SMALL = 40×40 px (renderScale 0.5) | LARGE = 160×160 px (renderScale 2.0)
export const GAME_VERSION = 'v0.1.0 Alpha';
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
export const CARNIVORE_BASE_HUNGER_DRAIN = 1.5; // ~66 seconds to starve (Stamina/Endurance buff)
export const OMNIVORE_BASE_HUNGER_DRAIN  = 2.3;  // Slightly more efficient than herbivore — opportunistic feeders

// ─── Health & Combat Stats ────────────────────────────────────────────────────
export const BASE_HEALTH = 100;
export const PASSIVE_HEAL_RATE = 10.0; // HP/sec regenerated if hunger > 80
export const STARVATION_DAMAGE = 5.0; // HP/sec lost if hunger <= 0

export const HERBIVORE_BASE_DAMAGE = 2.0;  // Weak
export const OMNIVORE_BASE_DAMAGE  = 5.0; // Moderate
export const CARNIVORE_BASE_DAMAGE = 40.0;  // 2.5s kill window — prey can flee if they detect early

// Exhaustion multipliers applied during specific BehaviorStates
export const FLEEING_HUNGER_MULTIPLIER = 1.0; // Handled by Stamina now
export const HUNTING_HUNGER_MULTIPLIER = 1.0;

// ─── Population limits ────────────────────────────────────────────────────────
const BASE_AREA = 1920 * 1080; // Assuming 1x is roughly 1080p
export const getGlobalPopulationCap = (w: number, h: number) => Math.floor(250 * ((w * h) / BASE_AREA));
export const getHerbivorePopulationCap = (w: number, h: number) => Math.floor(100 * ((w * h) / BASE_AREA));
export const getCarnivorePopulationCap = (w: number, h: number) => Math.floor(25 * ((w * h) / BASE_AREA));
export const getOmnivorePopulationCap = (w: number, h: number) => Math.floor(25 * ((w * h) / BASE_AREA));

// ─── Plant constants ──────────────────────────────────────────────────────────
export const getPlantCap = (w: number, h: number) => Math.floor(100 * ((w * h) / BASE_AREA));
export const PLANT_SPAWN_RATE   = 0.3;  // seconds between spawns (was 0.6 — doubled to support larger herds)
export const PLANT_GROWTH_RATE  = 0.4;  // growthStage increase per second (0→1 in ~2.5s)
export const PLANT_WOBBLE_SPEED = 1.2;  // radians/second for organic sway

// ─── Collision & Senses ───────────────────────────────────────────────────────
export const CARNIVORE_EAT_RANGE = 35;  // px
export const HERBIVORE_EAT_RANGE = 25;  // px
export const SIGHT_RADIUS        = 400; // px
export const MAX_STEERING_FORCE  = 120; // max velocity change per second

// ─── Reproduction ─────────────────────────────────────────────────────────────
export const HERBIVORE_REPRO_THRESHOLD = 75;
export const HERBIVORE_REPRO_COOLDOWN  = 15; 
export const CARNIVORE_REPRO_THRESHOLD = 75;
export const CARNIVORE_REPRO_COOLDOWN  = 45;
export const OMNIVORE_REPRO_THRESHOLD  = 85;
export const OMNIVORE_REPRO_COOLDOWN   = 30;

export const HERBIVORE_REPRO_CHANCE = 0.05; // 5% chance per eligible second
export const CARNIVORE_REPRO_CHANCE = 0.008; // 0.8% chance per eligible second
export const OMNIVORE_REPRO_CHANCE  = 0.030; // 3.0% — doubled to sustain viable mid-tier population
export const REPRO_SPAWN_OFFSET     = 65;    // px away from parent

// ─── Hopper movement ──────────────────────────────────────────────────────────
export const HOP_HEIGHT         = 80;   // max Z elevation in px (upward)
export const HOP_SPEED          = 3.5;  // radians/second for sine wave
export const HOP_PAUSE_DURATION = 0.5;  // seconds between hops

// ─── Pacer movement ───────────────────────────────────────────────────────────
export const PACER_MOVE_DURATION  = 1.5; // seconds of burst
export const PACER_PAUSE_DURATION = 2.0; // seconds of pause



// ─── Stamina & Combat Dynamics ───────────────────────────────────────────────
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_RATE = 15; // 6.7 seconds of pursuit before exhaustion
export const STAMINA_REGEN_RATE = 15; // symmetric 6.7s recovery between hunts
export const EXHAUSTION_SPEED_PENALTY = 0.5; // 50% slower when stamina is 0

export const LUNGE_DURATION = 2.5;          // seconds — longer burst to close the gap
export const LUNGE_COOLDOWN = 3.5;          // seconds — shorter cooldown between attempts
export const LUNGE_SPEED_MULTIPLIER = 2.5;  // 150% faster burst

// ─── Macro Systems (Day/Night & Weather) ─────────────────────────────────────
export const DAY_NIGHT_CYCLE_DURATION = 120; // 120 real seconds for a full 24h cycle (1 min day, 1 min night)
export const NIGHT_SIGHT_PENALTY = 0.4; // 60% reduction in sight radius

export const WEATHER_CYCLE_DURATION = 120; // 120 seconds per weather shift
export const RAIN_PLANT_SPAWN_MULTIPLIER = 2.0; // 2x plants
export const DROUGHT_PLANT_SPAWN_MULTIPLIER = 0.5; // half plants

// ─── Decal Stats ─────────────────────────────────────────────────────────────
export const DECAL_STATS: Record<string, { desc: string, stats: { label: string, value: string, isGood: boolean }[] }> = {
  'CARNIVORE_EYE': { desc: 'Piercing gaze for tracking prey.', stats: [{ label: 'Sight', value: '+15%', isGood: true }, { label: 'Bravery', value: '+10%', isGood: true }] },
  'HERBIVORE_EYE': { desc: 'Wide angle for spotting predators.', stats: [{ label: 'Sight', value: '+20%', isGood: true }, { label: 'Speed', value: '+5%', isGood: true }] },
  'INSECT_EYE': { desc: 'Incredible peripheral vision, but easily startled.', stats: [{ label: 'Sight', value: '+30%', isGood: true }, { label: 'Bravery', value: '-15%', isGood: false }] },
  'NOCTURNAL_EYE': { desc: 'Excellent vision in the dark.', stats: [{ label: 'Sight', value: '+25%', isGood: true }, { label: 'Energy', value: '-5%', isGood: false }] },
  'AQUATIC_EYE': { desc: 'Moist eyes that reduce energy drain slightly.', stats: [{ label: 'Sight', value: '+10%', isGood: true }, { label: 'Energy', value: '+5%', isGood: true }] },
  'CARNIVORE_JAW': { desc: 'Sharp teeth for tearing flesh.', stats: [{ label: 'Damage', value: '+30%', isGood: true }, { label: 'Energy', value: '-10%', isGood: false }] },
  'BEAK': { desc: 'Lightweight aerodynamic jaw.', stats: [{ label: 'Speed', value: '+15%', isGood: true }, { label: 'Damage', value: '-5%', isGood: false }] },
  'HERBIVORE_JAW': { desc: 'Flat molars for efficient chewing.', stats: [{ label: 'Energy', value: '+5%', isGood: true }, { label: 'Speed', value: '-5%', isGood: false }] },
  'PROBOSCIS': { desc: 'Long tube for sipping nectar.', stats: [{ label: 'Energy', value: '+8%', isGood: true }, { label: 'Damage', value: '-8%', isGood: false }] },
  'BALEEN': { desc: 'Filter feeding apparatus.', stats: [{ label: 'Energy', value: '+10%', isGood: true }, { label: 'Speed', value: '-8%', isGood: false }] },
};

// ─── Trait Stats ─────────────────────────────────────────────────────────────
export const TRAIT_STATS: Record<string, { desc: string, stats: { label: string, value: string, isGood: boolean }[] }> = {
  // Size
  'SMALL':  { desc: 'Tiny and evasive.', stats: [{ label: 'Speed', value: '+100%', isGood: true }, { label: 'Energy', value: '+50%', isGood: true }, { label: 'Health', value: '-50%', isGood: false }, { label: 'Damage', value: '-50%', isGood: false }] },
  'MEDIUM': { desc: 'A perfectly balanced organism.', stats: [] },
  'LARGE':  { desc: 'Mighty and resilient.', stats: [{ label: 'Health', value: '+100%', isGood: true }, { label: 'Damage', value: '+100%', isGood: true }, { label: 'Speed', value: '-50%', isGood: false }, { label: 'Energy', value: '-100%', isGood: false }] },
  // Movement
  'CRAWLER': { desc: 'Steady and predictable movement.', stats: [] },
  'HOPPER':  { desc: 'Jumps to avoid attacks and obstacles.', stats: [] },
  'PACER':   { desc: 'Moves in extremely fast, short bursts.', stats: [] },
  // Diet
  'HERBIVORE': { desc: 'Eats plants peacefully.', stats: [{ label: 'Base Damage', value: '2', isGood: false }] },
  'OMNIVORE':  { desc: 'Eats plants and scavenges.', stats: [{ label: 'Base Damage', value: '10', isGood: true }] },
  'CARNIVORE': { desc: 'Hunts other creatures for food.', stats: [{ label: 'Base Damage', value: '30', isGood: true }] },
};
