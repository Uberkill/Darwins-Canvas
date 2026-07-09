# Darwin's Canvas

Darwin's Canvas is a procedural ecosystem simulator where you can create, observe, and interact with a living digital terrarium. Built with React and HTML5 Canvas, it features a modular physics engine and highly optimized rendering.

## How to Play

1. **Create and Populate:** Use the Creation Lab to spawn creatures. You can mix herbivores, carnivores, and omnivores.
2. **Observe:** Pin up to 3 specific creatures to the Active Research HUD as they roam, hunt for food, sleep, and level up dynamically. 
3. **Interact:** Drop food, relocate them, or smite predators.
4. **Collect:** Save exceptional creatures to the Darwinpedia to generate lore and spawn them into future simulations.

## Core Technical Features

- **7-Pillar Modular Physics:** The simulation engine is strictly isolated (`NavigationSystem`, `LifeSystem`, etc.) for boids flocking, senescence, and combat to ensure O(1) grid performance.
- **Save / Load / Collect:** The `WorldState` serializes to `localStorage`, while the `Darwinpedia` uses IndexedDB to catalog saved creatures and their generated lore.
- **Map Expansions:** Supports 1x (Standard), 2x (Vast), and 3x (Epic) map generation for massive ecosystems.
- **Weather & Ecosystem Dynamics:** Deterministic `RAIN` and `DROUGHT` cycles affect plant yields, while an Immigration system prevents irreversible extinction.
- **Presentation Layer:** Mathematical VFX offsets and Web Audio API synthesized sounds (no external asset files).
- **Analytics & Tracking:** Tracks ecosystem data at exactly 1Hz and supports real-time HUD pinning for up to 3 individual creatures.
