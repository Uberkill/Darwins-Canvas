import { useEffect, useRef } from 'react'
import { worldRef, updateWorldDimensions } from './worldRef'
import { useStore } from '../store/useStore'
import { simulate } from './simulate'
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

      const storeState = useStore.getState()
      let dtRaw = lastTimeRef.current === 0 ? 0 : Math.max(0, timestamp - lastTimeRef.current)
      lastTimeRef.current = timestamp

      // Spiral of Death prevention: if tab is backgrounded, cap dtRaw
      if (dtRaw > 100) dtRaw = 100;

      try {
      // Apply timeScale
      const dt = dtRaw * storeState.timeScale

      const isPaused = storeState.isPanelOpen || storeState.isTutorialOpen || !isPlayingRef.current
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
        
        steps++

        accumulator.current -= FIXED_TIME_STEP;
      }

      // ── Camera State Machine & Lerping (Uncoupled from game time) ──
      const dtRealSec = dtRaw / 1000;
      const store = useStore.getState();
      const cam = world.camera;

      // Smooth zoom
      cam.zoom += (store.targetZoom - cam.zoom) * (1 - Math.exp(-dtRealSec * 5));

      if (store.cameraMode === 'TRACKING' && store.selectedCreatureId) {
        const target = world.creatures.find(c => c.id === store.selectedCreatureId);
        if (target) {
          // Track target smoothly
          cam.x += (target.x - cam.x) * (1 - Math.exp(-dtRealSec * 5));
          cam.y += (target.y - cam.y) * (1 - Math.exp(-dtRealSec * 5));
        } else {
          // Target died/despawned — Fallback to FREE mode exactly where they vanished
          store.setCameraMode('FREE');
          store.setSelectedCreatureId(null);
        }
      } else {
        // FREE MODE: Keyboard Panning
        const panAmount = store.panSpeed * dtRealSec;
        if (store.keys.up) cam.y -= panAmount;
        if (store.keys.down) cam.y += panAmount;
        if (store.keys.left) cam.x -= panAmount;
        if (store.keys.right) cam.x += panAmount;
      }

      // Frustum Clamping
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
