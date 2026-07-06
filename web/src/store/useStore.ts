import { create } from 'zustand'
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
export const useStore = create<GameStore>((set) => ({
  // ─── God Tools ────────────────────────────────────────────────────────────
  activeTool: 'POINTER',
  setActiveTool: (tool) => set({ activeTool: tool }),

  isPanelOpen: false,
  openPanel:   () => set({ isPanelOpen: true }),
  closePanel:  () => set({ isPanelOpen: false }),

  // ─── Tutorial state ───────────────────────────────────────────────────────
  isTutorialOpen: false,
  openTutorial:   () => set({ isTutorialOpen: true, selectedCreatureId: null }),
  closeTutorial:  () => set({ isTutorialOpen: false }),

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
}))
