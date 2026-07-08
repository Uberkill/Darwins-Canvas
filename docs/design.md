# Game Design & Mechanics ("Rules of the Universe")

Darwin's Canvas is a hands-off, Zen digital terrarium. Users interact by creating life and observing the ecosystem, not by micromanaging it.

## Core Game Loop
1. **Creation:** User draws a shape on a canvas and selects three traits: Size, Diet, and Movement.
2. **Release:** The creature is spawned into the world.
3. **Observation:** The creature lives, eats, starves, mates, and dies automatically based on its AI (boids + ecosystem rules).

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
To prevent irreversible ecosystem collapse, if any species (Herbivore, Carnivore, Omnivore) population drops to exactly `0`, the system begins an immigration check. Every `120` seconds, there is a `5%` chance for a new migrant of that species to wander onto the map.

## Evolution & Genetics
When a creature eats enough food, it builds up `reproduction reserve`. Once the reserve hits 100, it undergoes asexual reproduction.

### Inheritance & Mutation
- The offspring inherits the parent's base traits (size, diet, movement type) and visual `drawingData`.
- **Stat Mutations:** Speed, vision radius, and metabolic efficiency can fluctuate up or down by small percentages.
- **Hue Shift:** The offspring's visual color shifts slightly to represent its genetic lineage.

## Ecosystem Analytics
- The game tracks historical data (Populations, Births, Starvations, Kills, Calories) at exactly 1Hz.
- This data powers the in-game Statistics Dashboard.
