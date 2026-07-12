# Game Design & Mechanics ("Rules of the Universe")

Darwin's Canvas is primarily a hands-off, Zen digital terrarium. Users generally interact by creating life and observing the ecosystem, though they may intervene through specific God Tools.

## Core Game Loop
1. **World Building:** Before observing life, the player acts as a God sculpting the terrarium. The user can dynamically paint terrain types (Water, Grass, Dirt, Rock) using an interactive brush, or invoke Procedural Generation algorithms (Pangaea, Archipelago, Great Lakes) to sculpt continents instantly.
2. **Creation:** User draws a shape on a canvas and selects three traits: Size, Diet, and Movement.
3. **Release:** The creature is spawned into the world.
4. **Observation:** The creature lives, eats, starves, mates, and dies automatically based on its AI (boids + ecosystem rules).

### World Builder Safeties & UI
Because the game engine runs at 60 FPS, all Map Generation and Painting occurs in a detached **Draft Buffer**. The game engine does not calculate physical collisions for the new terrain until the user explicitly clicks **"Apply Changes"**.
If a user is procedurally generating a massive map, the UI invokes a race-condition lock preventing them from painting, and implements an `AbortController` to safely kill the generator if the window is resized mid-calculation.

## Ecosystem Mechanics

### Diets & The Food Chain
- **Herbivores:** Eat plants. They wander until they detect a plant, then seek it.
- **Carnivores:** Eat Herbivores and Scavengers. They hunt active prey.
- **Scavengers/Omnivores:** Eat plants primarily, but will eat dead organic matter if starving.

### Hunger & Starvation
- Hunger drains continuously on every tick.
- `metabolicCost` determines the drain rate. Larger, faster creatures burn more energy.
- When `hunger <= 0`, the creature dies and drops `meat` (food for scavengers).

## Environmental Systems

### Weather Cycles
The ecosystem transitions through three deterministic weather states:
- **CLEAR:** Standard plant generation.
- **RAIN:** Rapid plant generation.
- **DROUGHT:** Little to no plant generation.

### Immigration (Anti-Extinction)
To prevent irreversible ecosystem collapse, if any species (Herbivore, Carnivore, Omnivore) population drops to exactly `0`, the system begins an immigration check. Every `120` seconds, there is a `5%` chance for a new migrant of that species to wander onto the map. The system leverages an **asynchronous IndexedDB event queue** to pull saved creatures from the user's Darwinpedia collection, ensuring the 60FPS physics simulation thread never blocks while loading database assets.

### 2.5D World Constraints
The entire world operates on a flat Cartesian plane for physics collisions, but is rendered in 2.5D via the **Camera Tilt** (usually `0.4` ratio). All visual effects—such as Z-axis elevation for Hoppers, shadow rendering offsets, wobble, and breathing—are calculated via pure stateless math functions. Visuals **never** mutate the underlying physics grid.

## God Tools (Player Intervention)
The player possesses interactive tools to influence the simulation:
- **Smite:** Strike a creature with lightning to deal heavy damage and trigger fear behaviors.
- **Feed:** Spawn plant matter at a specific coordinate to assist starving creatures.
- **Grab:** Physically relocate a creature to a new coordinate coordinate.

## Evolution & Genetics
When a creature eats enough food, it builds up `reproduction reserve`. Once the reserve hits 100, it undergoes asexual reproduction.

### Inheritance & Mutation
- The offspring inherits the parent's base traits (size, diet, movement type) and visual `drawingData`.
- **Stat Mutations:** Speed, vision radius, and metabolic efficiency can fluctuate up or down by small percentages.
- **Hue Shift:** The offspring's visual color shifts slightly to represent its genetic lineage.

## Ecosystem Analytics & Tracking
- The game tracks historical data (Populations, Births, Starvations, Kills, Calories) at exactly 1Hz.
- Data is strictly capped at a 1-hour rolling window (3,600 data points) to guarantee save-file stability.
- **Active Research HUD:** Players can pin up to 3 creatures to track their real-time vitals. If a tracked creature dies, the tracking slot is automatically cleared (Ghost Eviction).

## Darwinpedia Collection
Players can save individual creatures to a persistent catalog:
- **Lore Generation:** Saving a creature generates a deterministic backstory based on its lifetime statistics (e.g., kills, food eaten).
- **Spawning:** Saved creatures can be spawned back into any terrarium state.
