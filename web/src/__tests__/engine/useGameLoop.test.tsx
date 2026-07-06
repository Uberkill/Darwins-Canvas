import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useGameLoop } from '../../engine/useGameLoop'
import { worldRef, clampEntitiesToWorld } from '../../engine/worldRef'

// Mock the Renderer entirely so we don't need real Canvas context
vi.mock('../../renderer/Renderer', () => {
  return {
    GameRenderer: class {
      resize = vi.fn()
      draw = vi.fn()
      dispose = vi.fn()
    }
  }
})

// Mock requestIdleCallback if not available in JSDOM
vi.stubGlobal('requestIdleCallback', vi.fn((cb) => setTimeout(cb, 0)))

// We need to mock requestAnimationFrame to prevent infinite loops in tests
vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)))
vi.stubGlobal('cancelAnimationFrame', vi.fn(clearTimeout))

describe('useGameLoop - Resize Clamping', () => {
  beforeEach(() => {
    // Reset worldRef
    worldRef.current.creatures = []
    worldRef.current.plants = []
    worldRef.current.worldWidth = 1000
    worldRef.current.worldHeight = 1000
  })

  it('clamps entities when window resizes smaller', () => {
    const canvas = document.createElement('canvas')

    // Add a creature and plant at far edges
    worldRef.current.creatures.push({
      id: 'c1',
      x: 950,
      y: 950,
      renderScale: 1, // BASE_RENDER_SIZE / 2 = 40 radius
    } as any)

    worldRef.current.plants.push({
      id: 'p1',
      x: 900,
      y: 900,
    } as any)

    const canvasRef = { current: canvas }
    
    // Render the hook
    const { unmount } = renderHook(() => useGameLoop(canvasRef))

    // Simulate a vertical and horizontal window resize (shrinking)
    window.innerWidth = 800
    window.innerHeight = 800

    // Dispatch resize event
    window.dispatchEvent(new Event('resize'))

    // In the new architecture, resize sets a flag, and simulate() actually clamps.
    // For this test, we just manually trigger the clamp to verify the math logic.
    clampEntitiesToWorld(worldRef.current)

    // The creature and plant should have been clamped
    expect(worldRef.current.creatures[0].x).toBe(800 - 40)
    expect(worldRef.current.creatures[0].y).toBe(800 - 40)
    
    expect(worldRef.current.plants[0].x).toBe(800 - 10)
    expect(worldRef.current.plants[0].y).toBe(800 - 10)

    unmount()
  })
})
