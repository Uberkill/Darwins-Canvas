import { useEffect, useRef } from 'react'
import { worldRef, updateWorldDimensions } from './worldRef'
import { useEngineStore } from '../store/useEngineStore'
import { useUIStore } from '../store/useUIStore'
import { simulate } from './simulate'
import { GameRenderer } from '../renderer/Renderer'
import { CameraSystem } from './systems/CameraSystem'
import { InteractionSystem } from './systems/InteractionSystem'
import { AnalyticsSystem } from './systems/AnalyticsSystem'
import { getCollectionMetadata, getCollectionBlob } from '../features/collection/collectionDB'
import { spawnCreature } from './entityManager'
import { buildCreature } from './creatureFactory'

const FIXED_TIME_STEP = 1000 / 60

/**
 * useGameLoop — the single requestAnimationFrame loop.
 *
 * Implements the Fixed Timestep Accumulator pattern:
 * - Accumlates real delta time
 * - Runs fixed `simulate` steps
 * - Renders exactly once per screen refresh
 * - Defers image cache cleanup to idle callbacks
 */
export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>, isPlaying: boolean) {
  const rafIdRef    = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulator = useRef<number>(0)
  const rendererRef = useRef<GameRenderer | null>(null)
  
  const isPlayingRef = useRef(isPlaying)
  isPlayingRef.current = isPlaying

  // Prevent default browser zooming/scrolling on the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const preventDefault = (e: WheelEvent) => e.preventDefault();
    canvas.addEventListener('wheel', preventDefault, { passive: false });
    return () => canvas.removeEventListener('wheel', preventDefault);
  }, [canvasRef]);

  useEffect(() => {
    let active = true

    // Only instantiate GameRenderer once per mount
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current)
    }

    function tick(timestamp: number) {
      if (!active || !canvasRef.current || !rendererRef.current) return

      const engineState = useEngineStore.getState()
      const uiState = useUIStore.getState()
      let dtRaw = lastTimeRef.current === 0 ? 0 : Math.max(0, timestamp - lastTimeRef.current)
      lastTimeRef.current = timestamp

      // Spiral of Death prevention: if tab is backgrounded, cap dtRaw
      if (dtRaw > 100) dtRaw = 100;

      try {
      // Apply timeScale
      const dt = dtRaw * engineState.timeScale

      const isPaused = uiState.isPanelOpen || uiState.isTutorialOpen || uiState.isPauseMenuOpen || uiState.isOnboardingOpen || !isPlayingRef.current
      if (isPaused) {
        accumulator.current = 0
      } else {
        accumulator.current += dt
        // Prevent Spiral of Death (cap at ~1 real second worth of time, scaled)
        if (accumulator.current > 1000) accumulator.current = 1000
      }

      const world = worldRef.current

      // 🔄 1. Simulate Fixed Timesteps 🔄
      let steps = 0
      while (accumulator.current >= FIXED_TIME_STEP && steps < 60) {
        const dtSec = FIXED_TIME_STEP / 1000;
        simulate(world, dtSec);
        AnalyticsSystem.update(world, dtSec);
        
        steps++

        accumulator.current -= FIXED_TIME_STEP;
      }

      // ─── Process Async Immigration Queue ───
      if (world.scratchpad.pendingImmigrations && world.scratchpad.pendingImmigrations.length > 0) {
        // Synchronously copy and clear the queue to prevent race conditions
        const pending = [...world.scratchpad.pendingImmigrations];
        world.scratchpad.pendingImmigrations = [];
        
        // Launch async fetch without blocking the physics loop
        (async () => {
          try {
            const meta = await getCollectionMetadata();
            for (const diet of pending) {
              // Try to find an exact diet match first
              let matching = meta.filter(m => m.diet === diet);
              
              // If no exact match, fallback to ANY creature in the book!
              if (matching.length === 0 && meta.length > 0) {
                matching = meta;
              }

              const side = Math.random() < 0.5 ? 0 : world.worldWidth;
              const y = Math.random() * (world.worldHeight - 200) + 100;

              let migrant;
              if (matching.length > 0) {
                // Pick a random saved creature
                const choice = matching[Math.floor(Math.random() * matching.length)];
                const blob = await getCollectionBlob(choice.id);
                if (blob) {
                  migrant = buildCreature({
                    name: choice.name || 'Migrant',
                    diet: diet, // FORCE the requested diet to maintain ecosystem balance
                    size: choice.size,
                    movement: choice.movement,
                    drawingData: blob.drawingData,
                    decals: blob.decals || [],
                    bakedSprites: blob.bakedSprites
                  }, world.worldWidth, world.worldHeight);
                }
              }

              if (!migrant) {
                // Fallback to default colored circle if DB fetch fails or no matches found
                const color = diet === 'HERBIVORE' ? 'green' : diet === 'CARNIVORE' ? 'red' : 'purple';
                const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40" fill="${color}"/></svg>`;
                migrant = buildCreature({
                  name: 'Migrant ' + diet.charAt(0) + diet.slice(1).toLowerCase(),
                  diet, size: 'MEDIUM', movement: 'CRAWLER', drawingData: svg, decals: []
                }, world.worldWidth, world.worldHeight);
              }

              // Override coordinates to ensure they spawn on the map edges
              migrant.x = side;
              migrant.y = y;
              
              spawnCreature(world, migrant);

              // Keep analytics in sync for accurate population graphs
              if (migrant.diet === 'CARNIVORE') world.analytics.currentSecondAccumulator.birthsCarn++;
              else if (migrant.diet === 'OMNIVORE') world.analytics.currentSecondAccumulator.birthsOmni++;
              else if (migrant.diet === 'HERBIVORE') world.analytics.currentSecondAccumulator.birthsHerb++;
            }
          } catch (err) {
            console.error('Failed to process async immigration', err);
          }
        })();
      }

      // ── Camera State Machine & Lerping (Uncoupled from game time) ──
      const dtRealSec = dtRaw / 1000;
      const store = useUIStore.getState();
      const canvas = canvasRef.current;
      
      if (canvas) {
        CameraSystem.update(world, store, dtRealSec, canvas.width, canvas.height, window.devicePixelRatio);
      }

      // ── Hit Detection (Uncoupled from physics timestep) ──
      InteractionSystem.update(world);

      // ── 2. Render ──
      rendererRef.current.draw(world)

      } catch (err) {
        console.error('Game loop error:', err);
      }

      rafIdRef.current = requestAnimationFrame(tick)
    }

    rafIdRef.current = requestAnimationFrame(tick)

    function handleResize() {
      updateWorldDimensions()
      if (rendererRef.current) {
        rendererRef.current.resize(window.innerWidth, window.innerHeight)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      active = false
      cancelAnimationFrame(rafIdRef.current)
      window.removeEventListener('resize', handleResize)
      if (rendererRef.current) {
        rendererRef.current.dispose()
        rendererRef.current = null
      }
    }
  }, [canvasRef])
}
