# Graph Report - .  (2026-07-05)

## Corpus Check
- Corpus is ~14,295 words - fits in a single context window. You may not need a graph.

## Summary
- 216 nodes · 393 edges · 23 communities (12 shown, 11 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `CreationPanel()` - 14 edges
4. `Creature` - 13 edges
5. `useGameLoop()` - 11 edges
6. `useStore` - 11 edges
7. `useDrawingCanvas()` - 10 edges
8. `WorldState` - 10 edges
9. `simulate()` - 9 edges
10. `PendingCreature` - 9 edges

## Surprising Connections (you probably didn't know these)
- `makeWorld()` --semantically_similar_to--> `makeWorld()`  [INFERRED] [semantically similar]
  src/__tests__/engine/collision.test.ts → src/__tests__/engine/simulate.test.ts
- `makeCreature()` --semantically_similar_to--> `makeCreature()`  [INFERRED] [semantically similar]
  src/__tests__/engine/collision.test.ts → src/__tests__/engine/movement.test.ts
- `TraitPicker()` --conceptually_related_to--> `Creature`  [INFERRED]
  src/ui/TraitPicker.tsx → src/types/index.ts
- `App()` --calls--> `useStore`  [EXTRACTED]
  src/App.tsx → src/store/useStore.ts
- `makeReadyCreature()` --calls--> `buildCreature()`  [EXTRACTED]
  src/__tests__/engine/simulate.test.ts → src/engine/simulate.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Creature Movement Behaviors** — engine_movement_movecrawler, engine_movement_movehopper, engine_movement_movepacer [INFERRED 0.95]
- **Simulation Engine Systems** — engine_simulate_simulate, engine_movement_movecrawler, engine_movement_movehopper, engine_movement_movepacer, engine_collision_runcollision, engine_reproduction_checkreproduction, engine_spawner_tickplantspawner [EXTRACTED 1.00]
- **Creature Traits Definition** — types_index_creature, types_index_creaturesize, types_index_movementtype, types_index_diettype [INFERRED 0.95]
- **Social Media Icons** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_github_icon, public_icons_social_icon, public_icons_x_icon [INFERRED 0.85]
- **SVG Icon Sprite Sheet** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_documentation_icon, public_icons_github_icon, public_icons_social_icon, public_icons_x_icon [EXTRACTED 1.00]

## Communities (23 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (24): CARNIVORE_EAT_RANGE, HERBIVORE_EAT_RANGE, SIZE_STATS, CollisionResult, runCollision(), makeCreature(), makeWorld(), Z-Gate Collision Pattern (+16 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (34): dependencies, lucide-react, react, react-dom, zustand, devDependencies, eslint, eslint-config-prettier (+26 more)

### Community 2 - "Community 2"
Cohesion: 0.14
Nodes (23): getWorldHeight(), getWorldWidth(), buildCreature(), makeReadyCreature(), useGameLoop(), createInitialWorldState(), updateWorldDimensions(), worldRef (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (18): CreatureSize, DietType, MovementType, BRUSH_SIZES, BrushPicker(), BrushPickerProps, ColorPalette(), ColorPaletteProps (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (8): applyBrushSettings(), checkIsEmpty(), DrawingCanvasHandle, DrawingTool, floodFill(), hexToRgb(), useDrawingCanvas(), Zero-Cost Crop Export

### Community 8 - "Community 8"
Cohesion: 0.46
Nodes (6): Command Bus Pattern, useStore, GameStore, PendingCreature, FAB(), FABProps

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **94 isolated node(s):** `parser`, `plugins`, `extends`, `browser`, `es2022` (+89 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useDrawingCanvas()` connect `Community 7` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `useStore` connect `Community 8` to `Community 2`, `Community 3`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `parser`, `plugins`, `extends` to the rest of the system?**
  _99 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.13636363636363635 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._