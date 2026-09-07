# Graph Report - .  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 712 nodes · 1571 edges · 74 communities (42 shown, 32 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `eac45e51`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.tsx
- index.ts
- index.ts
- WorldState
- devDependencies
- CollectionModal.tsx
- Creature
- audioEngine.ts
- scripts
- compilerOptions
- DesignSystemSandbox.tsx
- WorldSetupModal.tsx
- compilerOptions
- .eslintrc.json
- Fish Tank Project Overview
- PatchNotesModal.tsx
- baker.ts
- imageCache.ts
- .oxlintrc.json
- replace_random.mjs
- test-audit.js
- visual_audit.js
- Carnivores
- memory_maintenance.md
- The Game Loop
- Design System Sandbox HTML
- tsconfig.json
- Senescence
- Bluesky Icon
- MapSizePromptModal.tsx
- Zen Terrarium Sandbox
- Data Layer
- audioConfig.ts
- 3-Tier Separation
- 7-Pillar Physics Engine
- Boids Algorithm
- Data Layer
- Spatial Grid
- UI Aesthetics Constraints
- UI & Style Guide Restrictions
- Creature Matrix
- Simulation Loop
- MVP Boundaries
- Diet Logic
- Movement Behaviors
- Size Trade-off Matrix
- Root HTML Document
- Favicon SVG
- Discord Icon
- Documentation Icon
- GitHub Icon
- Darwin's Canvas
- Serena Project Config
- Hero Image: Isometric layered rounded squares with purple glow
- React Logo
- Vite
- BrushPicker
- ColorPalette
- EmptyState
- generateRandomName

## God Nodes (most connected - your core abstractions)
1. `useUIStore` - 41 edges
2. `WorldState` - 35 edges
3. `random()` - 29 edges
4. `Creature` - 26 edges
5. `worldRef` - 24 edges
6. `AudioEngine` - 23 edges
7. `simulate()` - 23 edges
8. `useEngineStore` - 21 edges
9. `compilerOptions` - 19 edges
10. `audio` - 18 edges

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
- **State Management Architecture** — store_usestore_usestore, engine_worldref_worldref, engine_usegameloop_usegameloop [INFERRED 0.85]
- **Drawing and Baking Pipeline** — hooks_usedrawingcanvas_usedrawingcanvas, renderer_baker_bakecreaturesprites, ui_creationpanel_creationpanel [INFERRED 0.95]

## Communities (74 total, 32 thin omitted)

### Community 0 - "App.tsx"
Cohesion: 0.06
Nodes (71): App(), useCreatureCount(), AudioController(), Props, getWorldHeight(), getWorldWidth(), audio, clearEntities() (+63 more)

### Community 1 - "index.ts"
Cohesion: 0.07
Nodes (43): Fixed Timestep Accumulator, DECAL_STATS, getCarnivorePopulationCap(), getGlobalPopulationCap(), getHerbivorePopulationCap(), getOmnivorePopulationCap(), getPlantCap(), getPlantSpawnRate() (+35 more)

### Community 2 - "index.ts"
Cohesion: 0.06
Nodes (41): Architecture Layering, exportBase64, calculateCreatureStats(), Props, Props, TradingCard(), UndoSnapshot, DrawingCanvasHandle (+33 more)

### Community 3 - "WorldState"
Cohesion: 0.08
Nodes (23): AnalyticsSystem, CameraSystem, EnvironmentSystem, InteractionSystem, drawCreature(), drawCreatureShadow(), drawFallback(), drawTrackingMarker() (+15 more)

### Community 4 - "devDependencies"
Cohesion: 0.04
Nodes (45): eslint, eslint-config-prettier, fake-indexeddb, fast-check, gh-pages, jsdom, oxlint, playwright (+37 more)

### Community 5 - "CollectionModal.tsx"
Cohesion: 0.12
Nodes (24): CollectionBlob, CollectionMeta, deleteFromCollection(), getCollectionBlob(), getCollectionDB(), getCollectionMetadata(), saveToCollection(), updateUserNotes() (+16 more)

### Community 6 - "Creature"
Cohesion: 0.10
Nodes (19): SIZE_STATS, BoidsForces, calculateBoids(), nearbyBoids, sharedBoidsResult, evaluateThoughts(), hunts(), nearbyCreatures (+11 more)

### Community 7 - "audioEngine.ts"
Cohesion: 0.15
Nodes (8): AudioEngine, generateCreatureEvent(), generateCrunch(), generateHealChime(), generateLevelUpChime(), generatePop(), generateSpawnChime(), generateZap()

### Community 8 - "scripts"
Cohesion: 0.08
Nodes (24): lucide-react, react, react-dom, simplex-noise, dependencies, lucide-react, react, react-dom (+16 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, ES2023, src, vite/client, compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly (+16 more)

### Community 10 - "DesignSystemSandbox.tsx"
Cohesion: 0.16
Nodes (12): Badge(), BadgeProps, Button, ButtonProps, ButtonVariant, Panel(), PanelProps, Tab (+4 more)

### Community 11 - "WorldSetupModal.tsx"
Cohesion: 0.16
Nodes (15): TERRAIN_COLORS, TERRAIN_VALUES, TerrainType, useTerrainPainter(), UseTerrainPainterProps, TerrainType, WorldSetupModalProps, MAP_TYPE_LABELS (+7 more)

### Community 12 - "compilerOptions"
Cohesion: 0.12
Nodes (16): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+8 more)

### Community 13 - ".eslintrc.json"
Cohesion: 0.17
Nodes (11): env, browser, es2022, extends, ignorePatterns, parser, plugins, rules (+3 more)

### Community 14 - "Fish Tank Project Overview"
Cohesion: 0.18
Nodes (11): Render Layer, Simulation Layer, Tech Stack Overview, Ecosystem Game Loop, Phase 4: Renderer, Phase 3: Simulation Engine, Rendering Buffer Conventions, State Management Conventions (+3 more)

### Community 15 - "PatchNotesModal.tsx"
Cohesion: 0.36
Nodes (6): getIconForType(), PATCH_NOTES, PatchNote, PatchNoteType, PatchNotesModal(), PatchNotesModalProps

### Community 16 - "baker.ts"
Cohesion: 0.43
Nodes (6): bakeCreatureSprites(), BakedSprites, loadImage(), DECAL_SVGS, DecalStyle, getDecalDataUrl()

### Community 17 - "imageCache.ts"
Cohesion: 0.48
Nodes (5): Zero-GC Buffer, cache, generateTintedImage(), getImage(), preloadImage()

### Community 18 - ".oxlintrc.json"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 19 - "replace_random.mjs"
Cohesion: 0.40
Nodes (5): __dirname, engineDir, __filename, replaceInFile(), walkDir()

### Community 20 - "test-audit.js"
Cohesion: 0.33
Nodes (4): assert, creatures, plants, renderBuffer

### Community 21 - "visual_audit.js"
Cohesion: 0.40
Nodes (5): ARTIFACTS_DIR, __dirname, __filename, runAudit(), runPass()

### Community 22 - "Carnivores"
Cohesion: 0.50
Nodes (5): Carnivores, Herbivores, Immigration System, Scavengers, Carrying Capacity

### Community 23 - "memory_maintenance.md"
Cohesion: 0.40
Nodes (4): Add/update threshold, Discovery Model, Maintenance Actions, Style

### Community 24 - "The Game Loop"
Cohesion: 0.50
Nodes (4): The Game Loop, Render Layer, Simulation Layer, Core Game Loop

### Community 25 - "Design System Sandbox HTML"
Cohesion: 0.67
Nodes (4): Visual Style & Aesthetic, Creation Workflow, Phase 2: Creation Lab, Design System Sandbox HTML

### Community 27 - "Senescence"
Cohesion: 0.67
Nodes (3): Evolution and Genetics, Evolution & Genetics, Senescence

### Community 28 - "Bluesky Icon"
Cohesion: 1.00
Nodes (3): Bluesky Icon, Social Icon, X Icon

## Knowledge Gaps
- **199 isolated node(s):** `parser`, `plugins`, `extends`, `browser`, `es2022` (+194 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **32 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `CreatureLoreCard()` connect `CollectionModal.tsx` to `scripts`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **Why does `react` connect `scripts` to `CollectionModal.tsx`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **What connects `parser`, `plugins`, `extends` to the rest of the system?**
  _199 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05654712260216847 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07333333333333333 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06041986687147977 - nodes in this community are weakly interconnected._
- **Should `WorldState` be split into smaller, more focused modules?**
  _Cohesion score 0.08272859216255443 - nodes in this community are weakly interconnected._