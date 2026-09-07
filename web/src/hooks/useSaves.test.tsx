import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSaves } from './useSaves';
import { listSaves, loadGame, deleteGame } from '../utils/saveSystem';
import { useEngineStore } from '../store/useEngineStore';
import { useUIStore } from '../store/useUIStore';

vi.mock('../utils/saveSystem', () => ({
  listSaves: vi.fn(),
  loadGame: vi.fn(),
  deleteGame: vi.fn(),
}));

vi.mock('../engine/worldRef', () => ({
  worldRef: {
    current: {
      timeOfDay: 0,
      weather: 'CLEAR',
      totalTime: 0,
      mapSizeMultiplier: 1,
      scratchpad: {
        terrain: null,
        terrainWidth: 0,
        terrainHeight: 0,
      },
      flags: {
        terrainChanged: false,
      },
      camera: {
        zoom: 1,
      }
    }
  },
  setWorldDimensions: vi.fn(),
  centerCamera: vi.fn(),
  getAutoFitZoom: vi.fn().mockReturnValue(1.5),
}));

vi.mock('../constants', () => ({
  getWorldWidth: vi.fn().mockReturnValue(1000),
  getWorldHeight: vi.fn().mockReturnValue(1000),
}));

vi.mock('../engine/entityManager', () => ({
  setEntities: vi.fn(),
  clearEntities: vi.fn(),
}));

describe('useSaves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (listSaves as any).mockResolvedValue([]);
  });

  it('initializes with default saves and updates after mount', async () => {
    (listSaves as any).mockResolvedValue([
      { id: 'slot_1', lastSaved: 1000, name: 'Test Save' }
    ]);
    
    const { result } = renderHook(() => useSaves());
    
    // Initial state
    expect(result.current.hasSaves).toBe(false);
    expect(result.current.mostRecentSlot).toBeNull();
    
    // Wait for fetchSaves
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(result.current.hasSaves).toBe(true);
    expect(result.current.mostRecentSlot).toBe('slot_1');
    expect(result.current.saves['slot_1']?.name).toBe('Test Save');
  });

  it('determines the most recent slot correctly', async () => {
    (listSaves as any).mockResolvedValue([
      { id: 'slot_1', lastSaved: 1000 },
      { id: 'slot_2', lastSaved: 2000 },
      { id: 'slot_3', lastSaved: 1500 },
    ]);
    
    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(result.current.mostRecentSlot).toBe('slot_2');
  });

  it('removes a save', async () => {
    (listSaves as any).mockResolvedValue([
      { id: 'slot_1', lastSaved: 1000 }
    ]);
    
    const { result } = renderHook(() => useSaves());
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(result.current.saves['slot_1']).not.toBeNull();
    
    await act(async () => {
      await result.current.removeSave('slot_1');
    });
    
    expect(deleteGame).toHaveBeenCalledWith('slot_1');
    expect(result.current.saves['slot_1']).toBeNull();
  });

  it('executes play for a new game', async () => {
    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await result.current.executePlay('slot_1', true);
    });
    
    expect(useEngineStore.getState().activeSaveSlot).toBe('slot_1');
    expect(useUIStore.getState().isOnboardingOpen).toBe(true);
  });

  it('executes play for a loaded game', async () => {
    (loadGame as any).mockResolvedValue({
      name: 'Loaded Game',
      creatures: [],
      plants: [],
      timeOfDay: 0.5,
      weather: 'RAIN',
      totalTime: 1000,
      mapSizeMultiplier: 2,
      terrain: new Uint8Array([1,2,3]),
      terrainWidth: 10,
      terrainHeight: 10,
    });

    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await result.current.executePlay('slot_1', false);
    });
    
    expect(useEngineStore.getState().pendingMapName).toBe('Loaded Game');
    expect(useEngineStore.getState().timeScale).toBe(1.0);
  });
  
  it('executes play for a loaded game with missing fields', async () => {
    (loadGame as any).mockResolvedValue({});

    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await result.current.executePlay('slot_1', false);
    });
    
    expect(useEngineStore.getState().pendingMapName).toBe('Ecosystem 1');
  });

  it('executes play for a loaded game that fails to load', async () => {
    (loadGame as any).mockResolvedValue(null);

    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await result.current.executePlay('slot_1', false);
    });
    
    expect(useEngineStore.getState().activeSaveSlot).toBe('slot_1');
  });

  it('ignores invalid save slots in listSaves', async () => {
    (listSaves as any).mockResolvedValue([
      { id: 'invalid_slot', lastSaved: 1000 }
    ]);
    
    const { result } = renderHook(() => useSaves());
    
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    expect(result.current.hasSaves).toBe(false);
  });
});
