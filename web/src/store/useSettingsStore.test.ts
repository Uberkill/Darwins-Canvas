import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore } from './useSettingsStore';
import { audio } from '../engine/audioEngine';

// Mock audio engine
vi.mock('../engine/audioEngine', () => ({
  audio: {
    setVolumes: vi.fn(),
  },
}));

describe('useSettingsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      uiScale: 1.0,
    });
  });

  it('initializes with default state', () => {
    const state = useSettingsStore.getState();
    expect(state.masterVolume).toBe(0.5);
    expect(state.sfxVolume).toBe(0.8);
    expect(state.musicVolume).toBe(0.4);
    expect(state.uiScale).toBe(1.0);
  });

  it('setSettings updates state and calls audio.setVolumes', () => {
    useSettingsStore.getState().setSettings({
      masterVolume: 0.7,
      sfxVolume: 0.6,
      musicVolume: 0.5,
      uiScale: 1.2,
    });

    const state = useSettingsStore.getState();
    expect(state.masterVolume).toBe(0.7);
    expect(state.sfxVolume).toBe(0.6);
    expect(state.musicVolume).toBe(0.5);
    expect(state.uiScale).toBe(1.2);
    expect(audio.setVolumes).toHaveBeenCalledWith(0.7, 0.6, 0.5);
  });

  it('setSettings with partial update still passes all volumes to audio.setVolumes', () => {
    useSettingsStore.getState().setSettings({
      masterVolume: 0.9,
    });

    const state = useSettingsStore.getState();
    expect(state.masterVolume).toBe(0.9);
    expect(state.sfxVolume).toBe(0.8);
    expect(state.musicVolume).toBe(0.4);
    expect(audio.setVolumes).toHaveBeenCalledWith(0.9, 0.8, 0.4);
  });
  
  it('migrate resets uiScale for version 0', () => {
    const migrate = (useSettingsStore.persist as any).getOptions().migrate;
    const migratedState = migrate({ masterVolume: 1.0, uiScale: 2.0 }, 0);
    expect(migratedState.uiScale).toBe(1.0);
    expect(migratedState.masterVolume).toBe(1.0);
  });

  it('migrate keeps state as is for version 1', () => {
    const migrate = (useSettingsStore.persist as any).getOptions().migrate;
    const migratedState = migrate({ masterVolume: 1.0, uiScale: 2.0 }, 1);
    expect(migratedState.uiScale).toBe(2.0);
    expect(migratedState.masterVolume).toBe(1.0);
  });

  it('onRehydrateStorage sets volumes on successful rehydration', () => {
    const onRehydrate = (useSettingsStore.persist as any).getOptions().onRehydrateStorage();
    onRehydrate({ masterVolume: 0.2, sfxVolume: 0.3, musicVolume: 0.4 } as any);
    expect(audio.setVolumes).toHaveBeenCalledWith(0.2, 0.3, 0.4);
  });

  it('onRehydrateStorage does nothing if state is undefined', () => {
    const onRehydrate = (useSettingsStore.persist as any).getOptions().onRehydrateStorage();
    onRehydrate(undefined);
    expect(audio.setVolumes).not.toHaveBeenCalled();
  });
});
