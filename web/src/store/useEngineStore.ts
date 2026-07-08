import { create } from 'zustand';
import type { EngineStore } from '../types';

export const useEngineStore = create<EngineStore>()((set) => ({
  timeScale: 1.0,
  setTimeScale: (scale) => set({ timeScale: scale }),

  activeSaveSlot: null,
  setActiveSaveSlot: (slot) => set({ activeSaveSlot: slot }),



  pendingCreature: null,
  queueCreature: (c) => set({ pendingCreature: c }),
  clearQueue: () => set({ pendingCreature: null }),
}));
