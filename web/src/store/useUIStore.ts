import { create } from 'zustand';
import type { UIStore } from '../types';
import { CAMERA_TILT } from '../constants';


export const useUIStore = create<UIStore>()((set) => ({
  activeTool: 'POINTER',
  setActiveTool: (tool) => set({ activeTool: tool }),

  selectedCreatureId: null,
  setSelectedCreatureId: (id) => set({ selectedCreatureId: id }),

  cameraMode: 'FREE',
  setCameraMode: (mode) => set({ cameraMode: mode }),
  
  targetZoom: 1.0,
  setTargetZoom: (zoom) => set({ targetZoom: zoom }),
  
  keys: { up: false, down: false, left: false, right: false },
  setKeys: (newKeys) => set((state) => ({ keys: { ...state.keys, ...newKeys } })),
  panSpeed: 1200,

  isPanelOpen: false,
  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false }),

  isTutorialOpen: false,
  openTutorial: () => set({ isTutorialOpen: true }),
  closeTutorial: () => set({ isTutorialOpen: false }),

  isOnboardingOpen: false,
  openOnboarding: () => set({ isOnboardingOpen: true }),
  closeOnboarding: () => set({ isOnboardingOpen: false }),

  isStatsOpen: false,
  openStats: () => set({ isStatsOpen: true }),
  closeStats: () => set({ isStatsOpen: false }),

  isPauseMenuOpen: false,
  openPauseMenu: () => set({ isPauseMenuOpen: true }),
  closePauseMenu: () => set({ isPauseMenuOpen: false }),
}));
