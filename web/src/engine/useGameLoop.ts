import { useEffect, useRef } from 'react'
import { worldRef, updateWorldDimensions } from './worldRef'
import { useStore } from '../store/useStore'
import { simulate } from './simulate'
import { releaseImage } from '../renderer/imageCache'
import { GameRenderer } from '../renderer/Renderer'

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
export function useGameLoop(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const rafIdRef    = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const accumulator = useRef<number>(0)
  const rendererRef = useRef<GameRenderer | null>(null)

  useEffect(() => {
    let active = true

    // Only instantiate GameRenderer once per mount
    if (canvasRef.current && !rendererRef.current) {
      rendererRef.current = new GameRenderer(canvasRef.current)
    }

    const aliveIdsBefore = new Set<string>()
    const aliveIdsAfter  = new Set<string>()

    function tick(timestamp: number) {
      if (!active || !canvasRef.current || !rendererRef.current) return

      const dt = lastTimeRef.current === 0 ? 0 : timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      const storeState = useStore.getState()
      const isPaused = storeState.isPanelOpen || storeState.isTutorialOpen
      if (isPaused) {
        accumulator.current = 0
      } else {
        accumulator.current += dt
        // Prevent Spiral of Death (cap at ~15 frames worth of time)
        if (accumulator.current > 250) accumulator.current = 250
      }

      const world = worldRef.current

      // ── 1. Simulate Fixed Timesteps ──
      let steps = 0
      while (accumulator.current >= FIXED_TIME_STEP && steps < 10) {
        aliveIdsBefore.clear()
        for (const c of world.creatures) aliveIdsBefore.add(c.id)

        const dtSec = FIXED_TIME_STEP / 1000;
        simulate(world, dtSec);

        // ── Camera State Machine & Lerping ──
        const store = useStore.getState()
        const cam = world.camera

        // Smooth zoom
        cam.zoom += (store.targetZoom - cam.zoom) * (1 - Math.exp(-dtSec * 5))

        if (store.cameraMode === 'TRACKING' && store.selectedCreatureId) {
          const target = world.creatures.find(c => c.id === store.selectedCreatureId)
          if (target) {
            // Track target smoothly
            cam.x += (target.x - cam.x) * (1 - Math.exp(-dtSec * 5))
            cam.y += (target.y - cam.y) * (1 - Math.exp(-dtSec * 5))
          } else {
            // Target died/despawned — Fallback to FREE mode exactly where they vanished
            store.setCameraMode('FREE')
            store.setSelectedCreatureId(null)
          }
        }

        // Frustum Clamping
        // Calculate visible area based on physical canvas size and zoom
        if (rendererRef.current) {
          const canvas = canvasRef.current;
          if (canvas) {
            const visibleW = (canvas.width / window.devicePixelRatio) / cam.zoom;
            const visibleH = (canvas.height / window.devicePixelRatio) / cam.zoom;
            
            let minX = visibleW / 2;
            let maxX = world.worldWidth - visibleW / 2;
            let minY = visibleH / 2;
            let maxY = world.worldHeight - visibleH / 2;

            if (minX > maxX) { minX = world.worldWidth / 2; maxX = world.worldWidth / 2; }
            if (minY > maxY) { minY = world.worldHeight / 2; maxY = world.worldHeight / 2; }

            // Clamp
            cam.x = Math.max(minX, Math.min(maxX, cam.x));
            cam.y = Math.max(minY, Math.min(maxY, cam.y));
          }
        }

        
        accumulator.current -= FIXED_TIME_STEP
        steps++

        aliveIdsAfter.clear()
        for (const c of world.creatures) aliveIdsAfter.add(c.id)

        const toRelease: string[] = []
        for (const id of aliveIdsBefore) {
          if (!aliveIdsAfter.has(id)) toRelease.push(id)
        }
        
        // ── 4. Deferred Memory Cleanup ──
        if (toRelease.length > 0) {
          const runRelease = () => {
            for (const id of toRelease) releaseImage(id)
          }
          if (typeof requestIdleCallback === 'function') {
            requestIdleCallback(runRelease)
          } else {
            setTimeout(runRelease, 0)
          }
        }
      }

      // ── 2. Render ──
      rendererRef.current.draw(world)



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
