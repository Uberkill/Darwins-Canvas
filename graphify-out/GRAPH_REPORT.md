# Graph Report - darwins-canvas  (2026-07-06)

## Corpus Check
- 54 files · ~26,109 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 314 nodes · 503 edges · 45 communities (26 shown, 19 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 22 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Engine Simulation Core|Engine Simulation Core]]
- [[_COMMUNITY_UI Renderer Integration|UI Renderer Integration]]
- [[_COMMUNITY_UI Configuration Panels|UI Configuration Panels]]
- [[_COMMUNITY_App TS Config|App TS Config]]
- [[_COMMUNITY_Rendering Subsystem|Rendering Subsystem]]
- [[_COMMUNITY_Package Scripts & Deps|Package Scripts & Deps]]
- [[_COMMUNITY_Node TS Config|Node TS Config]]
- [[_COMMUNITY_Package Dev Dependencies|Package Dev Dependencies]]
- [[_COMMUNITY_Game Loop Context|Game Loop Context]]
- [[_COMMUNITY_Architecture Memos|Architecture Memos]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Oxlint Config|Oxlint Config]]
- [[_COMMUNITY_Design Docs Spec|Design Docs Spec]]
- [[_COMMUNITY_Social Icons SVG|Social Icons SVG]]
- [[_COMMUNITY_Root TS Config|Root TS Config]]
- [[_COMMUNITY_PRD Concept Docs|PRD Concept Docs]]
- [[_COMMUNITY_Architecture Data Layer|Architecture Data Layer]]
- [[_COMMUNITY_Hero Image PNG|Hero Image PNG]]
- [[_COMMUNITY_React Logo SVG|React Logo SVG]]
- [[_COMMUNITY_Vite Logo SVG|Vite Logo SVG]]
- [[_COMMUNITY_Creature Matrix Spec|Creature Matrix Spec]]
- [[_COMMUNITY_Simulation Loop Spec|Simulation Loop Spec]]
- [[_COMMUNITY_Serena Memory Config|Serena Memory Config]]
- [[_COMMUNITY_Favicon SVG|Favicon SVG]]
- [[_COMMUNITY_Discord Icon SVG|Discord Icon SVG]]
- [[_COMMUNITY_Documentation Icon SVG|Documentation Icon SVG]]
- [[_COMMUNITY_GitHub Icon SVG|GitHub Icon SVG]]
- [[_COMMUNITY_Serena Project Config|Serena Project Config]]
- [[_COMMUNITY_MVP Boundaries Docs|MVP Boundaries Docs]]
- [[_COMMUNITY_Diet Logic Specs|Diet Logic Specs]]
- [[_COMMUNITY_Movement Behavior Specs|Movement Behavior Specs]]
- [[_COMMUNITY_Size Matrix Specs|Size Matrix Specs]]
- [[_COMMUNITY_App HTML Entry|App HTML Entry]]
- [[_COMMUNITY_Readme Documentation|Readme Documentation]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]

## God Nodes (most connected - your core abstractions)
1. `useStore` - 20 edges
2. `compilerOptions` - 19 edges
3. `compilerOptions` - 16 edges
4. `Creature` - 14 edges
5. `simulate()` - 12 edges
6. `GameRenderer` - 11 edges
7. `WorldState` - 10 edges
8. `useGameLoop()` - 9 edges
9. `worldRef` - 9 edges
10. `useDrawingCanvas()` - 9 edges

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
- **3-Tier Architecture** — src_02_system_architecture_data_layer, src_02_system_architecture_simulation_layer, src_02_system_architecture_render_layer [EXTRACTED 1.00]
- **Ecosystem Game Loop Steps** — src_04_workflows_and_logic_ecosystem_game_loop, src_03_design_and_creatures_movement_behaviors, src_03_design_and_creatures_diet_logic [INFERRED 0.85]
- **SVG Icon Sprite Sheet** — public_icons_bluesky_icon, public_icons_discord_icon, public_icons_documentation_icon, public_icons_github_icon, public_icons_social_icon, public_icons_x_icon [EXTRACTED 1.00]

## Communities (45 total, 19 thin omitted)

### Community 0 - "Engine Simulation Core"
Cohesion: 0.12
Nodes (26): getWorldHeight(), getWorldWidth(), SIZE_STATS, CollisionResult, runCollision(), moveCrawler(), moveHopper(), movePacer() (+18 more)

### Community 1 - "UI Renderer Integration"
Cohesion: 0.10
Nodes (26): Architecture Layering, getCanvasPoint(), getWorldPoint(), App(), useCreatureCount(), useStore, BehaviorState, CameraMode (+18 more)

### Community 2 - "UI Configuration Panels"
Cohesion: 0.10
Nodes (26): applyBrushSettings(), checkIsEmpty(), DrawingCanvasHandle, DrawingTool, floodFill(), hexToRgb(), useDrawingCanvas(), setupCanvas() (+18 more)

### Community 3 - "App TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+11 more)

### Community 4 - "Rendering Subsystem"
Cohesion: 0.26
Nodes (8): drawCreature(), drawCreatureShadow(), drawFallback(), drawPlant(), getImage(), GameRenderer, Creature, Plant

### Community 5 - "Package Scripts & Deps"
Cohesion: 0.12
Nodes (16): dependencies, lucide-react, react, react-dom, zustand, name, private, scripts (+8 more)

### Community 6 - "Node TS Config"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 7 - "Package Dev Dependencies"
Cohesion: 0.12
Nodes (16): devDependencies, eslint, eslint-config-prettier, jsdom, oxlint, @testing-library/jest-dom, @testing-library/react, @types/node (+8 more)

### Community 8 - "Game Loop Context"
Cohesion: 0.20
Nodes (9): Core Game Loop, Diets & The Food Chain, Ecosystem Mechanics, Evolution & Genetics, Game Design & Mechanics ("Rules of the Universe"), Hunger & Starvation, Inheritance, Mutation (+1 more)

### Community 9 - "Architecture Memos"
Cohesion: 0.18
Nodes (12): Rendering Buffer Conventions, State Management Conventions, Fish Tank Project Overview, Suggested CLI Commands, Task Completion Commands, Serena Tech Stack Note, Render Layer, Simulation Layer (+4 more)

### Community 10 - "ESLint Config"
Cohesion: 0.22
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 11 - "Oxlint Config"
Cohesion: 0.38
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 12 - "Design Docs Spec"
Cohesion: 0.67
Nodes (4): Design System Sandbox HTML, Visual Style & Aesthetic, Creation Workflow, Phase 2: Creation Lab

### Community 13 - "Social Icons SVG"
Cohesion: 1.00
Nodes (3): Bluesky Icon, Social Icon, X Icon

### Community 22 - "Serena Memory Config"
Cohesion: 0.33
Nodes (5): Add/update threshold, Discovery Model, Maintenance Actions, Memory Maintenance, Style

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (8): AI Agent Instructions, Building for Production, Darwin's Canvas, Development Server, Documentation, Installation, Quick Start, Tech Stack

### Community 37 - "Community 37"
Cohesion: 0.29
Nodes (6): 3-Tier Separation, Boids Algorithm (Flocking), Performance Constraints, Spatial Grid (Broad-Phase Collision), Technical Architecture, The Game Loop (`useGameLoop.ts`)

### Community 38 - "Community 38"
Cohesion: 0.29
Nodes (6): Colors, Icons & Graphics, Interactive States, Shape and Structure, Typography, UI & Style Guide

## Knowledge Gaps
- **138 isolated node(s):** `browser`, `es2022`, `@typescript-eslint/no-unused-vars`, `@typescript-eslint/explicit-module-boundary-types`, `@typescript-eslint/no-non-null-assertion` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useStore` connect `UI Renderer Integration` to `Engine Simulation Core`, `UI Configuration Panels`, `Rendering Subsystem`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `GameRenderer` connect `Rendering Subsystem` to `Engine Simulation Core`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `Creature` connect `Rendering Subsystem` to `Engine Simulation Core`, `UI Renderer Integration`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `Creature` (e.g. with `drawCreature()` and `drawCreatureShadow()`) actually correct?**
  _`Creature` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `browser`, `es2022`, `@typescript-eslint/no-unused-vars` to the rest of the system?**
  _142 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Engine Simulation Core` be split into smaller, more focused modules?**
  _Cohesion score 0.12367864693446089 - nodes in this community are weakly interconnected._
- **Should `UI Renderer Integration` be split into smaller, more focused modules?**
  _Cohesion score 0.10121457489878542 - nodes in this community are weakly interconnected._