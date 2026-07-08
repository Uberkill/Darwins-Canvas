import { useEffect, useRef } from 'react'
import { worldRef, updateWorldDimensions } from './worldRef'
import { useEngineStore } from '../store/useEngineStore'
import { useUIStore } from '../store/useUIStore'
import { simulate } from './simulate'
import { GameRenderer } from '../renderer/Renderer'
import { CameraSystem } from './systems/CameraSystem'
import { InteractionSystem } from './systems/InteractionSystem'
import { AnalyticsSystem } from './systems/AnalyticsSystem'

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
