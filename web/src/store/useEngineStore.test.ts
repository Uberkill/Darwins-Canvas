import { describe, it, expect, beforeEach } from 'vitest';
import { useEngineStore } from './useEngineStore';

describe('useEngineStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useEngineStore.setState({
      timeScale: 1.0,
      activeSaveSlot: null,
      pendingMapName: null,
      pendingCreature: null,
    });
  });

  it('initializes with default state', () => {
    const state = useEngineStore.getState();
    expect(state.timeScale).toBe(1.0);
    expect(state.activeSaveSlot).toBeNull();
    expect(state.pendingMapName).toBeNull();
    expect(state.pendingCreature).toBeNull();
  });

  it('setTimeScale updates timeScale', () => {
    useEngineStore.getState().setTimeScale(2.5);
    expect(useEngineStore.getState().timeScale).toBe(2.5);
  });

  it('setActiveSaveSlot updates activeSaveSlot', () => {
    useEngineStore.getState().setActiveSaveSlot('slot_1');
    expect(useEngineStore.getState().activeSaveSlot).toBe('slot_1');
  });

  it('setPendingMapName updates pendingMapName', () => {
    useEngineStore.getState().setPendingMapName('My Map');
    expect(useEngineStore.getState().pendingMapName).toBe('My Map');
  });

  it('queueCreature updates pendingCreature', () => {
    const creature = { type: 'Carnivore' } as any;
    useEngineStore.getState().queueCreature(creature);
    expect(useEngineStore.getState().pendingCreature).toBe(creature);
  });

  it('clearQueue clears pendingCreature', () => {
    const creature = { type: 'Carnivore' } as any;
    useEngineStore.getState().queueCreature(creature);
    useEngineStore.getState().clearQueue();
    expect(useEngineStore.getState().pendingCreature).toBeNull();
  });
});
