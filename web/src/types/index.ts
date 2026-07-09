import type { SpatialGrid } from '../engine/SpatialGrid';

// ─── Creature enums ───────────────────────────────────────────────────────────
export type CreatureSize  = 'SMALL' | 'MEDIUM' | 'LARGE';
export type MovementType  = 'CRAWLER' | 'HOPPER' | 'PACER';
export type DietType      = 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE';
type CreatureState = 'IDLE' | 'MOVING' | 'EATING' | 'JUMPING' | 'PAUSED' | 'FIGHTING';
type BehaviorState = 'WANDERING' | 'FORAGING' | 'FLEEING' | 'SLEEPING';
type MoodType = 'HAPPY' | 'SCARED' | 'HUNGRY' | 'SLEEPY' | 'ANGRY';

// ─── Core entity: Creature ────────────────────────────────────────────────────
export interface Creature {
  // Identity
  id:          string;
  name:        string;   // assigned at creation
  drawingData: string;   // Base64 PNG — set once at creation, never changes

  // Position
  x: number;
  y: number; // Logical Y on the ground plane
  z: number; // Elevation (for Hoppers)

  // Traits (set at creation, immutable)
  size:     CreatureSize;
  movement: MovementType;
  diet:     DietType;

  // Cached stats (derived from size at creation — never recalculated per-frame)
  speed:          number;   // px/second
  hungerDrainRate: number;  // hunger points/second
  renderScale:    number;   // visual scale multiplier
  maxHealth:      number;
  damage:         number;   // damage per second in combat

  // Live simulation state
  health:    number;        // 0 to maxHealth
  hunger:    number;        // 0–100; starts at STARTING_HUNGER (80)
  direction: { vx: number, vy: number }; // normalized 2D vector
  state:     CreatureState;
  behavior:  BehaviorState;
  targetId:  string | null; // ID of the entity we are chasing/fleeing
  sightRadius: number;      // How far the creature can see (px)
  age:       number;        // total seconds alive
  maxAge:    number;        // maximum lifespan in seconds
  generation: number;       // genetic lineage depth (1 = created by player)
  currentScale: number;     // live scale (0.5 for babies, up to 1.5 for adults)
  panicTimer: number;       // time remaining for fleeing fear Memory

  // Stamina & Combat
  stamina:    number;       // 0 to maxStamina (drained when fleeing)
  maxStamina: number;
  lungeTimer: number;       // active lunge time remaining
  lungeCooldownTimer: number; // time until next lunge can be used
  eatingTimer: number;      // active eating time remaining

  // Movement sub-state (all movement types share the struct; only relevant fields used)
  hopPhase:       number;   // radians — sine wave phase for HOPPER
  hopPauseTimer:  number;   // seconds remaining in between-hop pause
  pacerMoveTimer:  number;  // seconds of burst movement remaining
  pacerPauseTimer: number;  // seconds of pause remaining
  pacerPaused:    boolean;  // is the pacer currently stopped?

  // Reproduction
  reproductionCooldown: number; // seconds until next reproduction allowed

  // Personality & Brain
  bravery:   number;        // 0.0 to 1.0 (0 = skittish, 1 = fearless)
  kills:     number;        // Lifetime kills
  foodEaten: number;        // Lifetime plants eaten
  level:     number;        // 1 to 10, computed from kills and foodEaten
  mood:      MoodType;      // Current emotional state
  intent:    string;        // "Inner thoughts" text

  // Visuals
  decals: Decal[];
  bakedSprites?: {
    IDLE: string;
    SLEEPING: string;
    EATING: string;
    FIGHTING: string;
  };

  // Evolution & Genetics
  hueShift:           number;
  baseDrainRate:      number; // Base metabolism before stat multipliers
  baseStats: {
    speed: number;
    sightRadius: number;
    maxHealth: number;
    renderScale: number;
    damage: number;
  };
  hitTimer: number; // time remaining for damage flash/shake
}

// ─── Core entity: Plant ───────────────────────────────────────────────────────
export interface Plant {
  id:          string;
  type?:       'PLANT' | 'MEAT'; // If undefined, assume 'PLANT'
  x:           number;
  y:           number;
  growthStage: number;  // 0.0–1.0 — drives visual size
  wobblePhase: number;  // radians — drives organic sway animation
}


// ─── Camera ───────────────────────────────────────────────────────────────────
interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

// ─── Population Tracking ──────────────────────────────────────────────────────
export interface EcosystemDataPoint {
  time: number;
  carnivore: number;
  omnivore: number;
  herbivore: number;
  plant: number;
  meat: number;
  birthsCarn: number; birthsOmni: number; birthsHerb: number;
  starvationCarn: number; starvationOmni: number; starvationHerb: number;
  huntedCarn: number; huntedOmni: number; huntedHerb: number;
  damageCarn: number; damageOmni: number; damageHerb: number;
  caloriesCarn: number; caloriesOmni: number; caloriesHerb: number;
  maxGeneration: number;
}

export interface EcosystemAnalytics {
  currentSecondAccumulator: {
    birthsCarn: number; birthsOmni: number; birthsHerb: number;
    starvationCarn: number; starvationOmni: number; starvationHerb: number;
    huntedCarn: number; huntedOmni: number; huntedHerb: number;
    damageCarn: number; damageOmni: number; damageHerb: number;
    caloriesCarn: number; caloriesOmni: number; caloriesHerb: number;
  };
  history: EcosystemDataPoint[];
}

// ─── World state (lives in worldRef — NOT in Zustand) ────────────────────────
export interface VisualEffect {
  id: string;
  type: 'LIGHTNING' | 'HEAL' | 'SPAWN';
  x: number;
  y: number;
  timer: number;    // Current time remaining (in seconds or arbitrary units)
  maxTimer: number; // Total duration of the effect
  seed: number;     // Random seed for procedural effects
}

export interface WorldState {
  creatures:       Creature[];
  plants:          Plant[];
  visualEffects?:  VisualEffect[]; // Optional for backward compatibility with old saves
  plantSpawnTimer: number;   // countdown seconds to next plant spawn
  activeLure:      { x: number; y: number; timer: number } | null;
  totalTime:       number;   // total elapsed seconds
  worldWidth:      number;   // updated on resize
  worldHeight:     number;   // updated on resize
  mapSizeMultiplier: number; // 1x, 2x, 3x size
  mouseX:          number;   // logical cursor X (for hover detection)
  mouseY:          number;   // logical cursor Y (for hover detection)
  hoveredEntityId: string | null;
  flags:           { boundsChanged: boolean };

  // Macro Systems
  timeOfDay:       number;   // 0.0 to 1.0 (cycles every day)
  weather:         'CLEAR' | 'RAIN' | 'DROUGHT';

  // Camera Sub-system
  camera:          CameraState;

  // Zero-GC execution scratchpad
  scratchpad: {
    deletedCreatureIds: Set<string>;
    deletedPlantIds:    Set<string>;
    spatialGrid:        SpatialGrid;
    immigrationTimer?:  number;
  };
  // Drag and Drop
  draggedEntityId: string | null;
  // System State
  isPaused: boolean;
  
  // Statistics & History
  analytics: EcosystemAnalytics;
  historyTimer: number;
}

// ─── Zustand store (command bus only — zero simulation state) ─────────────────
export type GodTool = 'POINTER' | 'SMITE' | 'HEAL' | 'FEED' | 'LURE' | 'GRAB' | 'CLONE';

type CameraMode = 'FREE' | 'TRACKING';

export interface UIStore {
  activeTool:      GodTool;
  setActiveTool:   (tool: GodTool) => void;

  // Selection UI
  selectedCreatureId: string | null;
  setSelectedCreatureId: (id: string | null) => void;

  // Camera Mode
  cameraMode:      CameraMode;
  setCameraMode:   (mode: CameraMode) => void;
  // We use this to force the camera logic to snap/zoom appropriately when buttons are clicked
  targetZoom:      number;
  setTargetZoom:   (zoom: number) => void;
  
  // Camera Panning
  keys: { up: boolean; down: boolean; left: boolean; right: boolean };
  setKeys: (keys: Partial<{ up: boolean; down: boolean; left: boolean; right: boolean }>) => void;
  panSpeed: number;

  isPanelOpen:     boolean;
  openPanel:       () => void;
  closePanel:      () => void;

  isTutorialOpen:  boolean;
  openTutorial:    () => void;
  closeTutorial:   () => void;

  isOnboardingOpen: boolean;
  openOnboarding:   () => void;
  closeOnboarding:  () => void;

  isStatsOpen: boolean;
  openStats: () => void;
  closeStats: () => void;

  isPauseMenuOpen:  boolean;
  openPauseMenu:    () => void;
  closePauseMenu:   () => void;
}

export interface EngineStore {
  timeScale:       number;
  setTimeScale:    (scale: number) => void;

  // Save System
  activeSaveSlot:  string | null;
  setActiveSaveSlot: (slot: string | null) => void;



  pendingCreature: PendingCreature | null;
  queueCreature:   (c: PendingCreature) => void;
  clearQueue:      () => void;
}

export interface SettingsStore {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  uiScale: number;
  setSettings: (settings: Partial<{ masterVolume: number; sfxVolume: number; musicVolume: number; uiScale: number }>) => void;
}

// ─── What the creation panel hands off on "Release" ──────────────────────────
export interface Decal {
  type: 'EYE' | 'MOUTH';
  style: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface PendingCreature {
  drawingData: string;
  name:        string;
  size:        CreatureSize;
  movement:    MovementType;
  diet:        DietType;
  decals:      Decal[];
  bakedSprites?: {
    IDLE: string;
    SLEEPING: string;
    EATING: string;
    FIGHTING: string;
  };
}
