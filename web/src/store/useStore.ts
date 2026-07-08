import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { audio } from '../engine/audioEngine'
import type { GameStore, PendingCreature } from '../types'

/**
 * useStore — Zustand command bus (NOT simulation state)
 *
 * This store only handles UI state and the bridge between
 * the creation panel and the game loop. It is NEVER written
 * to by the simulation engine — only by user actions.
 *
 * Fast path: worldRef (in useGameLoop.ts) — mutated directly at 60fps
 * Slow path: this store — only fires React re-renders on user actions
 */
export const useStore = create<GameStore>()(
  persist(
    (set) => ({
      // ─── God Tools ────────────────────────────────────────────────────────────
      activeTool: 'POINTER',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // ─── Save System ────────────────────────────────────────────────────────────
  activeSaveSlot: null,
  setActiveSaveSlot: (slot) => set({ activeSaveSlot: slot }),

  // ─── Time Controls ──────────────────────────────────────────────────────────
  timeScale: 1.0,
  setTimeScale: (scale) => set({ timeScale: scale }),

  isPanelOpen: false,
  openPanel:   () => set({ isPanelOpen: true }),
  closePanel:  () => set({ isPanelOpen: false }),

  // ─── Tutorial state ───────────────────────────────────────────────────────
  isTutorialOpen: false,
  openTutorial:  () => set({ isTutorialOpen: true }),
  closeTutorial: () => set({ isTutorialOpen: false }),

  isOnboardingOpen: false,
  openOnboarding:  () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => set({ isOnboardingOpen: false }),

  isPauseMenuOpen: false,
  previousTimeScale: 1.0,
  openPauseMenu: () => set((state) => ({ 
    isPauseMenuOpen: true, 
    previousTimeScale: state.timeScale, 
    timeScale: 0 
  })),
  closePauseMenu: () => set((state) => ({ 
    isPauseMenuOpen: false, 
    timeScale: state.previousTimeScale 
  })),

  // ─── Settings ─────────────────────────────────────────────────────────────
  masterVolume: 0.5,
  sfxVolume: 0.8,
  musicVolume: 0.4,
  uiScale: 1.0,
  setSettings: (settings) => set((state) => {
    const newState = { ...state, ...settings };
    // Tell audio engine to update volumes
    audio.setVolumes(newState.masterVolume, newState.sfxVolume, newState.musicVolume);
    return settings;
  }),

  // ─── Selection ────────────────────────────────────────────────────────────
  selectedCreatureId: null,
  setSelectedCreatureId: (id) => set({ selectedCreatureId: id }),

  cameraMode: 'FREE',
  setCameraMode: (mode) => set({ cameraMode: mode }),
  targetZoom: 1.0,
  setTargetZoom: (zoom) => set({ targetZoom: zoom }),

  // ─── Pending creature queue ───────────────────────────────────────────────
  // The game loop polls this every frame. When set, it injects the creature
  // into worldRef and calls clearQueue() to avoid double-injection.
  pendingCreature: null,
  queueCreature:   (c: PendingCreature) => set({ pendingCreature: c }),
  clearQueue:      () => set({ pendingCreature: null }),
    }),
    {
      name: 'darwins-canvas-settings',
      partialize: (state) => ({
        masterVolume: state.masterVolume,
        sfxVolume: state.sfxVolume,
        musicVolume: state.musicVolume,
        uiScale: state.uiScale,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          audio.setVolumes(state.masterVolume, state.sfxVolume, state.musicVolume);
        }
      }
    }
  )
)
