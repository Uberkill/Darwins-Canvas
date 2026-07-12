# Darwin's Canvas

Darwin's Canvas is a procedural ecosystem simulator where you can create, observe, and interact with a living digital terrarium. Built with React and HTML5 Canvas, it features a modular physics engine and highly optimized rendering.

## How to Play

1. **World Building:** Act as a God and sculpt your terrarium. Procedurally generate massive Archipelagos, or hand-paint Custom Coastlines using the World Builder brush.
2. **Create and Populate:** Use the Creation Lab to spawn creatures. You can mix herbivores, carnivores, and omnivores.
3. **Observe:** Pin up to 3 specific creatures to the Active Research HUD as they roam the 2.5D diorama, hunt for food, sleep, and level up dynamically. 
4. **Interact:** Drop food, relocate them, or smite predators.
5. **Collect:** Save exceptional creatures to the Darwinpedia to generate lore and spawn them into future simulations.

## Core Technical Features

- **Procedural 2.5D Diorama:** The ecosystem is beautifully rendered in an isometric 2.5D perspective with depth fog, day/night lighting cycles, and `simplex-noise` driven map generation.
- **7-Pillar Modular Physics:** The simulation engine is strictly isolated (`NavigationSystem`, `LifeSystem`, etc.) for boids flocking, senescence, and combat to ensure O(1) grid performance.
- **Save / Load / Collect:** The `WorldState` serializes to `localStorage`, while the `Darwinpedia` uses IndexedDB to catalog saved creatures and their generated lore.
- **Weather & Ecosystem Dynamics:** Deterministic `RAIN` and `DROUGHT` cycles affect plant yields, while an Immigration system prevents irreversible extinction.
- **Presentation Layer:** Mathematical VFX offsets and Web Audio API synthesized sounds (no external asset files).
- **Analytics & Tracking:** Tracks ecosystem data at exactly 1Hz and supports real-time HUD pinning for up to 3 individual creatures.
