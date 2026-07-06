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
- **Scavengers:** Eat dead organic matter (meat chunks left behind by predators or starvation).

### Hunger & Starvation
- Hunger drains continuously on every tick.
- `metabolicCost` determines the drain rate. Larger, faster creatures burn more energy.
- When `hunger <= 0`, the creature dies and drops `meat` (food for scavengers).

## Evolution & Genetics
When a creature eats enough food, it builds up `reproduction reserve`. Once the reserve hits 100, it undergoes asexual reproduction.

### Inheritance
- The offspring inherits the parent's base traits (size, diet, movement type).
- The offspring inherits the parent's `drawingData` (visually represented with a hue shift).

### Mutation
- During reproduction, there is a chance for random mutations.
- **Stat Mutations:** Speed, vision radius, and metabolic efficiency can fluctuate up or down by small percentages.
- **Hue Shift:** The offspring's visual color shifts slightly to represent its genetic lineage.
- Favorable mutations allow a creature to survive longer and reproduce more, naturally shifting the ecosystem's population over time.

## Tutorial System
- An interactive, book-like UI that overlays the game.
- Opening the tutorial pauses the ecosystem.
- Contains a Quick Start guide (3 simple steps) and a comprehensive Field Guide.
