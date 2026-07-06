// ─── Creature enums ───────────────────────────────────────────────────────────
export type CreatureSize  = 'SMALL' | 'MEDIUM' | 'LARGE';
export type MovementType  = 'CRAWLER' | 'HOPPER' | 'PACER';
export type DietType      = 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE';
type CreatureState = 'IDLE' | 'MOVING' | 'EATING' | 'JUMPING' | 'PAUSED' | 'FIGHTING';
export type BehaviorState = 'WANDERING' | 'FORAGING' | 'FLEEING' | 'SLEEPING';
export type MoodType = 'HAPPY' | 'SCARED' | 'HUNGRY' | 'SLEEPY' | 'ANGRY';

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

  // Stamina & Combat
  stamina:    number;       // 0 to maxStamina (drained when fleeing)
  maxStamina: number;
  lungeTimer: number;       // active lunge time remaining
  lungeCooldownTimer: number; // time until next lunge can be used

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
  mood:      MoodType;      // Current emotional state
  intent:    string;        // "Inner thoughts" text

  // Evolution & Genetics
  hueShift:           number;
  baseDrainRate:      number; // Base metabolism before stat multipliers
  baseStats: {
    speed: number;
    sightRadius: number;
    maxHealth: number;
    maxStamina: number;
    renderScale: number;
    bravery: number;
  };
}

// ─── Core entity: Plant ───────────────────────────────────────────────────────
export interface Plant {
  id:          string;
  x:           number;
  y:           number;
  growthStage: number;  // 0.0–1.0 — drives visual size
  wobblePhase: number;  // radians — drives organic sway animation
}

// ─── Camera ───────────────────────────────────────────────────────────────────
export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

// ─── World state (lives in worldRef — NOT in Zustand) ────────────────────────
export interface WorldState {
  creatures:       Creature[];
  plants:          Plant[];
  plantSpawnTimer: number;   // countdown seconds to next plant spawn
  herbivoreSpawnTimer: number; // countdown seconds to next wild herbivore spawn
  activeLure:      { x: number; y: number; timer: number } | null;
  totalTime:       number;   // total elapsed seconds
  worldWidth:      number;   // updated on resize
  worldHeight:     number;   // updated on resize
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
  };
  // Drag and Drop
  draggedEntityId: string | null;
  // System State
  isPaused: boolean;
}

// ─── Zustand store (command bus only — zero simulation state) ─────────────────
export type GodTool = 'POINTER' | 'SMITE' | 'FEED' | 'LURE' | 'GRAB';

export type CameraMode = 'FREE' | 'TRACKING';

export interface GameStore {
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

  isPanelOpen:     boolean;
  openPanel:       () => void;
  closePanel:      () => void;

  isTutorialOpen:  boolean;
  openTutorial:    () => void;
  closeTutorial:   () => void;

  pendingCreature: PendingCreature | null;
  queueCreature:   (c: PendingCreature) => void;
  clearQueue:      () => void;
}

// ─── What the creation panel hands off on "Release" ──────────────────────────
export interface PendingCreature {
  drawingData: string;
  name:        string;
  size:        CreatureSize;
  movement:    MovementType;
  diet:        DietType;
}
