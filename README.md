# Darwin's Canvas

Darwin's Canvas is a procedural ecosystem simulator where you can create, observe, and interact with a living digital terrarium. Built with React and HTML5 Canvas, it features a modular physics engine and highly optimized rendering.

## How to Play

1. **Create and Populate:** Use the Creation Lab to spawn creatures. You can mix herbivores, carnivores, and omnivores.
2. **Observe:** Track specific creatures as they roam, hunt for food, sleep, and level up dynamically. 
3. **Interact:** Drop food, heal them, lure them, grab them, or smite predators.

## Core Technical Features

- **7-Pillar Modular Physics:** The simulation engine is broken down into isolated, single-responsibility modules (`NavigationSystem`, `LifeSystem`, etc.) for boids flocking, senescence (aging), and combat.
- **Save / Load System:** The entire `WorldState` serializes seamlessly to `localStorage` every 5 seconds.
- **Weather & Ecosystem Dynamics:** Deterministic `RAIN` and `DROUGHT` cycles affect plant yields, while an Immigration system prevents irreversible extinction spirals.
- **Procedural VFX & SFX:** Mathematical presentation-layer visuals (e.g. Pillar of Light drop animations) and Web Audio API synthesized sounds (no bloated `.mp3` or `.wav` files).
- **Bubbly Analytics UI:** A kid-friendly, highly saturated, top-middle-bottom dashboard tracks births, deaths, and calories over time without relying on generic emojis or dark glassmorphism.
