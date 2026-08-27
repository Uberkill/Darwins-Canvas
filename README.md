# Darwin's Canvas

Darwin's Canvas is a 2.5D ecosystem simulation built with React and HTML5 Canvas. It features a custom physics engine and procedural map generation.

## How to Play

1. **World Setup:** Press "Play" to enter the World Setup mode. Paint terrain types or invoke procedural generation (Pangaea, Archipelago).
2. **Onboarding:** First-time players receive an interactive tutorial overlay.
3. **Creation:** Draw creatures in the Creation Lab, selecting their diet, movement type, and base stats.
4. **Observation:** Pin up to 3 creatures to the Active Research HUD to track their vitals in real-time.
5. **Interaction:** Use God Tools (Smite, Feed, Grab) to manipulate the ecosystem.
6. **Collection:** Save creatures to the Darwinpedia to record their statistics and spawn them in future sessions.

## Core Technical Features

- **Procedural 2.5D Diorama:** Rendered in isometric 2.5D with depth fog, lighting cycles, and `simplex-noise` driven map generation.
- **7-Pillar Physics Engine:** The simulation is divided into core systems (`NavigationSystem`, `LifeSystem`, etc.) for boids flocking, senescence, and combat, utilizing a SpatialGrid for O(1) grid performance.
- **Save / Load / Collect:** The `WorldState` serializes to `localStorage`, while the `Darwinpedia` uses IndexedDB to catalog saved creatures and their generated lore.
- **Weather & Ecosystem Dynamics:** Deterministic `RAIN` and `DROUGHT` cycles affect plant yields, while an Immigration system prevents irreversible extinction.
- **Presentation Layer:** Mathematical VFX offsets and Web Audio API synthesized sounds (no external asset files).
- **Analytics & Tracking:** Tracks ecosystem data at exactly 1Hz and supports real-time HUD pinning for up to 3 individual creatures.

## Testing & Automation

Run the UI visual audit suite via Playwright to verify layout integrity across all interactive modals:
```bash
npm run dev -- --port 5175 &
npm run audit:ui
```
