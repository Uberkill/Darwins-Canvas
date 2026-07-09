# Graph Report - .  (2026-07-09)

## Corpus Check
- 85 files · ~53,114 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 497 nodes · 1023 edges · 64 communities (32 shown, 32 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 48
- Community 49
- Community 50
- Community 51
- Community 54
- Community 55
- Community 57
- Community 58
- Community 59
- Community 61

## God Nodes (most connected - your core abstractions)
1. `useUIStore` - 33 edges
2. `WorldState` - 31 edges
3. `Creature` - 27 edges
4. `AudioEngine` - 23 edges
5. `SpatialGrid` - 20 edges
6. `worldRef` - 19 edges
7. `compilerOptions` - 18 edges
8. `useEngineStore` - 18 edges
9. `compilerOptions` - 15 edges
10. `Plant` - 15 edges

## Surprising Connections (you probably didn't know these)
- `useStore` --implements--> `Architecture Layering`  [INFERRED]
  web/src/store/useStore.ts → FISH_TANK.md
- `Zero-GC Buffer` --semantically_similar_to--> `cache`  [INFERRED] [semantically similar]
  renderer/Renderer.ts → web/src/renderer/imageCache.ts
- `Zen Terrarium Sandbox` --semantically_similar_to--> `Zen Terrarium Sandbox`  [INFERRED] [semantically similar]
  FISH_TANK.md → src/01_PRD_Core_Concept.md
- `Tech Stack Overview` --semantically_similar_to--> `Serena Tech Stack Note`  [INFERRED] [semantically similar]
  src/02_System_Architecture.md → web/.serena/memories/tech_stack.md
- `State Management Conventions` --semantically_similar_to--> `Simulation Layer`  [INFERRED] [semantically similar]
  web/.serena/memories/conventions.md → src/02_System_Architecture.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Entity Management Actions** — engine_entitymanager_spawncreature, engine_entitymanager_spawnplant, engine_entitymanager_killcreature, engine_entitymanager_killplant, engine_entitymanager_flushdeadentities, engine_entitymanager_clearentities [EXTRACTED 1.00]
- **State Management Architecture** — store_usestore_usestore, engine_worldref_worldref, engine_usegameloop_usegameloop [INFERRED 0.85]
- **Drawing and Baking Pipeline** — hooks_usedrawingcanvas_usedrawingcanvas, renderer_baker_bakecreaturesprites, ui_creationpanel_creationpanel [INFERRED 0.95]

## Communities (64 total, 32 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (42): getCarnivorePopulationCap(), getGlobalPopulationCap(), getHerbivorePopulationCap(), getOmnivorePopulationCap(), getPlantCap(), TRAIT_STATS, BoidsForces, calculateBoids() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (40): App(), useCreatureCount(), AudioController(), Props, getWorldHeight(), getWorldWidth(), audio, useGameLoop() (+32 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (37): dependencies, lucide-react, react, react-dom, zustand, devDependencies, eslint, eslint-config-prettier (+29 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (11): AUDIO_ASSETS, AudioEngine, generateCreatureEvent(), generateCrunch(), generateHealChime(), generateLevelUpChime(), generatePop(), generateSpawnChime() (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (27): Architecture Layering, SIZE_STATS, buildCreature(), calculateCreatureStats(), useStore, BehaviorState, CameraMode, CameraState (+19 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (23): exportBase64, DECAL_STATS, UndoSnapshot, useCanvasHistory(), DrawingCanvasHandle, DrawingTool, useDrawingCanvas(), bakeCreatureSprites() (+15 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (15): Zero-GC Buffer, clearEntities(), killPlant(), resetWorld(), setEntities(), drawCreatureShadow(), drawEffects(), drawEnvironment() (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (19): useSaves(), DoodleLayer(), EmergencyResetButton(), MapSizePromptModal(), MapSizePromptModalProps, PatchNotesModal(), PatchNotesModalProps, SaveSlotsModal() (+11 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 9 - "Community 9"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 10 - "Community 10"
Cohesion: 0.21
Nodes (5): Fixed Timestep Accumulator, AnalyticsSystem, CameraSystem, InteractionSystem, UIStore

### Community 11 - "Community 11"
Cohesion: 0.17
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (11): Render Layer, Simulation Layer, Tech Stack Overview, Ecosystem Game Loop, Phase 4: Renderer, Phase 3: Simulation Engine, Rendering Buffer Conventions, State Management Conventions (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (5): Carnivores, Herbivores, Immigration System, Scavengers, Carrying Capacity

### Community 15 - "Community 15"
Cohesion: 0.40
Nodes (4): Add/update threshold, Discovery Model, Maintenance Actions, Style

### Community 16 - "Community 16"
Cohesion: 0.50
Nodes (4): The Game Loop, Render Layer, Simulation Layer, Core Game Loop

### Community 17 - "Community 17"
Cohesion: 0.67
Nodes (4): Visual Style & Aesthetic, Creation Workflow, Phase 2: Creation Lab, Design System Sandbox HTML

### Community 19 - "Community 19"
Cohesion: 0.67
Nodes (3): Evolution and Genetics, Evolution & Genetics, Senescence

### Community 20 - "Community 20"
Cohesion: 1.00
Nodes (3): Bluesky Icon, Social Icon, X Icon

## Knowledge Gaps
- **165 isolated node(s):** `parser`, `plugins`, `extends`, `browser`, `es2022` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `WorldState` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 10`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `Creature` connect `Community 0` to `Community 1`, `Community 4`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `parser`, `plugins`, `extends` to the rest of the system?**
  _173 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0688088283024992 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09474206349206349 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.11948790896159317 - nodes in this community are weakly interconnected._