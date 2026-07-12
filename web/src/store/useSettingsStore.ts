import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { audio } from '../engine/audioEngine';
import type { SettingsStore } from '../types';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      uiScale: 1.0,
      setSettings: (settings) => set((state) => {
        const newState = { ...state, ...settings };
        audio.setVolumes(newState.masterVolume, newState.sfxVolume, newState.musicVolume);
        return newState;
      }),
    }),
    {
      name: 'darwins-canvas-settings',
      version: 1, // Increment this when we make breaking changes to settings schema
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Reset uiScale to 1.0 for users coming from the old unversioned app
          // to fix the massive UI scaling bug
          return { ...persistedState, uiScale: 1.0 };
        }
        return persistedState as SettingsStore;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          audio.setVolumes(state.masterVolume, state.sfxVolume, state.musicVolume);
        }
      }
    }
  )
);
