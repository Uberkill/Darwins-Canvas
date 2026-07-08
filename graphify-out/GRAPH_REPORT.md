# Graph Report - .  (2026-07-09)

## Corpus Check
- 64 files · ~46,227 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 378 nodes · 706 edges · 57 communities (27 shown, 30 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.87)
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
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]

## God Nodes (most connected - your core abstractions)
1. `useStore` - 24 edges
2. `compilerOptions` - 18 edges
3. `simulate()` - 18 edges
4. `WorldState` - 16 edges
5. `compilerOptions` - 15 edges
6. `Creature` - 15 edges
7. `worldRef` - 13 edges
8. `GameRenderer` - 13 edges
9. `audio` - 11 edges
10. `runCollision()` - 10 edges

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
- **Game Loop Systems** — engine_simulate_simulate, systems_navigationsystem_update, systems_lifesystem_update, engine_collision_runcollision, engine_reproduction_checkreproduction, engine_spawner_tickplantspawner [EXTRACTED 1.00]
- **Entity Management Actions** — engine_entitymanager_spawncreature, engine_entitymanager_spawnplant, engine_entitymanager_killcreature, engine_entitymanager_killplant, engine_entitymanager_flushdeadentities, engine_entitymanager_clearentities [EXTRACTED 1.00]
- **State Management Architecture** — store_usestore_usestore, engine_worldref_worldref, engine_usegameloop_usegameloop [INFERRED 0.85]
- **Drawing and Baking Pipeline** — hooks_usedrawingcanvas_usedrawingcanvas, renderer_baker_bakecreaturesprites, ui_creationpanel_creationpanel [INFERRED 0.95]
- **UI Components Using Zustand Store** — web_src_ui_pausemenumodal_pausemenumodal, web_src_ui_statsbutton_statsbutton, web_src_ui_statspanel_statspanel, web_src_ui_timecontrols_timecontrols, web_src_ui_titlescreen_titlescreen, web_src_ui_tutorialmodal_tutorialmodal [INFERRED 0.95]

## Communities (57 total, 30 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (34): WorldState, runCollision(), buildCreature(), calculateCreatureStats(), clearEntities(), flushDeadEntities(), killCreature(), killPlant() (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (29): DECAL_STATS, DrawingCanvasHandle, DrawingTool, exportBase64, floodFill(), getPixelBounds(), UndoSnapshot, bakeCreatureSprites() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.11
Nodes (24): getWorldHeight(), getWorldWidth(), TRAIT_STATS, audio, clampEntitiesToWorld(), createInitialWorldState(), updateWorldDimensions(), worldRef (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (35): dependencies, lucide-react, react, react-dom, zustand, devDependencies, eslint, eslint-config-prettier (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (17): evaluateThoughts(), hunts(), PerceptionResult, sizeValue(), BehaviorState, CameraMode, CameraState, CreatureState (+9 more)

### Community 6 - "Community 6"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.23
Nodes (6): Fixed Timestep Accumulator, drawCreatureShadow(), GameRenderer, Creature, Plant, SaveSlotData

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (11): Render Layer, Simulation Layer, Tech Stack Overview, Ecosystem Game Loop, Phase 4: Renderer, Phase 3: Simulation Engine, Rendering Buffer Conventions, State Management Conventions (+3 more)

### Community 11 - "Community 11"
Cohesion: 0.47
Nodes (4): createMockCreature(), createMockPlant(), createMockWorld(), saveGame

### Community 12 - "Community 12"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 13 - "Community 13"
Cohesion: 0.40
Nodes (4): SIZE_STATS, PendingCreature, buildCreature, makeReadyCreature()

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
- **149 isolated node(s):** `parser`, `plugins`, `extends`, `browser`, `es2022` (+144 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **30 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useStore` connect `Community 2` to `Community 0`, `Community 1`, `Community 4`, `Community 5`, `Community 8`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `GameRenderer` connect `Community 8` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Creature` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 11`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `parser`, `plugins`, `extends` to the rest of the system?**
  _157 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.10741971207087486 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08710801393728224 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1064102564102564 - nodes in this community are weakly interconnected._