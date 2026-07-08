import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './useStore'

describe('useStore State Consistency', () => {
  beforeEach(() => {
    // Reset store before each test
    useStore.setState({
      activeTool: 'POINTER',
      timeScale: 1.0,
      activeSaveSlot: null,
      selectedCreatureId: null,
      cameraMode: 'FREE',
      targetZoom: 1.0,
      keys: { up: false, down: false, left: false, right: false },
      panSpeed: 1200,
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      uiScale: 1.0,
      isPanelOpen: false,
      isTutorialOpen: false,
      isOnboardingOpen: false,
      isStatsOpen: false,
      isPauseMenuOpen: false,
      previousTimeScale: 1.0,
      pendingCreature: null,
    })
  })

  it('updates keys when setKeys is called', () => {
    const { setKeys } = useStore.getState()
    
    setKeys({ up: true, left: true })
    
    const state = useStore.getState()
    expect(state.keys.up).toBe(true)
    expect(state.keys.left).toBe(true)
    expect(state.keys.down).toBe(false)
    expect(state.keys.right).toBe(false)
  })

  it('correctly tracks previous timeScale when pausing/unpausing the menu', () => {
    const store = useStore.getState()
    store.setTimeScale(2.5) // Fast forward
    
    useStore.getState().openPauseMenu()
    
    const pausedState = useStore.getState()
    expect(pausedState.timeScale).toBe(0)
    expect(pausedState.previousTimeScale).toBe(2.5)
    
    useStore.getState().closePauseMenu()
    
    const unpausedState = useStore.getState()
    expect(unpausedState.timeScale).toBe(2.5)
  })
})
