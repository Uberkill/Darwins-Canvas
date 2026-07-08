# Graph Report - .  (2026-07-08)

## Corpus Check
- 74 files · ~35,705 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 266 nodes · 267 edges · 69 communities (24 shown, 45 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.88)
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
- Community 37
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67

## God Nodes (most connected - your core abstractions)
1. `compilerOptions` - 18 edges
2. `compilerOptions` - 15 edges
3. `useStore` - 14 edges
4. `CreationPanel()` - 8 edges
5. `simulate` - 8 edges
6. `scripts` - 7 edges
7. `useGameLoop` - 7 edges
8. `Fish Tank Project Overview` - 6 edges
9. `App()` - 5 edges
10. `Memory Maintenance` - 5 edges

## Surprising Connections (you probably didn't know these)
- `useStore` --implements--> `Architecture Layering`  [INFERRED]
  web/src/store/useStore.ts → FISH_TANK.md
- `Zen Terrarium Sandbox` --semantically_similar_to--> `Zen Terrarium Sandbox`  [INFERRED] [semantically similar]
  FISH_TANK.md → src/01_PRD_Core_Concept.md
- `Tech Stack Overview` --semantically_similar_to--> `Serena Tech Stack Note`  [INFERRED] [semantically similar]
  src/02_System_Architecture.md → web/.serena/memories/tech_stack.md
- `State Management Conventions` --semantically_similar_to--> `Simulation Layer`  [INFERRED] [semantically similar]
  web/.serena/memories/conventions.md → src/02_System_Architecture.md
- `Rendering Buffer Conventions` --semantically_similar_to--> `Render Layer`  [INFERRED] [semantically similar]
  web/.serena/memories/conventions.md → src/02_System_Architecture.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SVG Icon Sprite Sheet** — web_public_icons_bluesky_icon, web_public_icons_discord_icon, web_public_icons_documentation_icon, web_public_icons_github_icon, web_public_icons_social_icon, web_public_icons_x_icon [EXTRACTED 1.00]
- **3-Tier Architecture Layers** — docs_architecture_data_layer, docs_architecture_simulation_layer, docs_architecture_render_layer [EXTRACTED 1.00]
- **3-Tier Architecture** — src_02_system_architecture_data_layer, src_02_system_architecture_simulation_layer, src_02_system_architecture_render_layer [EXTRACTED 1.00]
- **Ecosystem Game Loop Steps** — src_04_workflows_and_logic_ecosystem_game_loop, src_03_design_and_creatures_movement_behaviors, src_03_design_and_creatures_diet_logic [INFERRED 0.85]

## Communities (69 total, 45 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.14
Nodes (19): Architecture Layering, App(), useCreatureCount(), getWorldPoint, preloadImage, useStore, GameStore, GodTool (+11 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (17): getWorldHeight(), getWorldWidth(), SIZE_STATS, moveCrawler, moveHopper, movePacer, checkReproduction, buildCreature (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.16
Nodes (18): calculateCreatureStats, useDrawingCanvas, bakeCreatureSprites, getCanvasPoint, setupCanvas, getDecalDataUrl, DietType, MovementType (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (16): dependencies, lucide-react, react, react-dom, zustand, name, private, scripts (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.13
Nodes (12): runCollision, GameRenderer, Creature, Plant, WorldState, TitleScreen(), TitleScreenProps, deleteGame (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-prettier, jsdom, oxlint, @testing-library/jest-dom, @testing-library/react, @types/node (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.17
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (12): Render Layer, Simulation Layer, Tech Stack Overview, Ecosystem Game Loop, Phase 4: Renderer, Phase 3: Simulation Engine, Rendering Buffer Conventions, State Management Conventions (+4 more)

### Community 10 - "Community 10"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 11 - "Community 11"
Cohesion: 0.33
Nodes (5): Add/update threshold, Discovery Model, Maintenance Actions, Memory Maintenance, Style

### Community 12 - "Community 12"
Cohesion: 0.50
Nodes (4): The Game Loop, Render Layer, Simulation Layer, Core Game Loop

### Community 13 - "Community 13"
Cohesion: 0.67
Nodes (4): Carnivores, Herbivores, Scavengers, Carrying Capacity

### Community 14 - "Community 14"
Cohesion: 0.67
Nodes (4): Visual Style & Aesthetic, Creation Workflow, Phase 2: Creation Lab, Design System Sandbox HTML

### Community 16 - "Community 16"
Cohesion: 1.00
Nodes (3): Bluesky Icon, Social Icon, X Icon

## Knowledge Gaps
- **154 isolated node(s):** `parser`, `plugins`, `extends`, `browser`, `es2022` (+149 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **45 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useGameLoop` connect `Community 1` to `Community 0`, `Community 6`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Community 7` to `Community 5`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `simulate` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `parser`, `plugins`, `extends` to the rest of the system?**
  _161 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.13538461538461538 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13043478260869565 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._