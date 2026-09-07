import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTerrainPainter } from './useTerrainPainter';
import { TerrainGenerator } from '../utils/terrainGenerator';
import { worldRef } from '../engine/worldRef';

vi.mock('../utils/terrainGenerator', () => ({
  TerrainGenerator: {
    generateAsync: vi.fn(),
  }
}));

vi.mock('../engine/worldRef', () => ({
  TERRAIN_CELL_SIZE: 10,
  worldRef: {
    current: {
      scratchpad: {
        terrain: undefined,
        terrainWidth: 0,
        terrainHeight: 0,
      },
      flags: {
        terrainChanged: false,
      }
    }
  }
}));

describe('useTerrainPainter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    worldRef.current.scratchpad.terrain = undefined;
    worldRef.current.scratchpad.terrainWidth = 0;
    worldRef.current.scratchpad.terrainHeight = 0;
    worldRef.current.flags.terrainChanged = false;
  });

  const defaultProps = {
    worldDims: { w: 100, h: 100 },
    minimapScale: 1,
    activeBrush: 'DIRT' as any,
    brushSize: 2,
    isPaintingAllowed: true,
  };

  it('initializes terrain arrays', () => {
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    expect(result.current.draftTerrainRef.current).not.toBeNull();
    // 100 / 10 = 10, 10x10 = 100 cells
    expect(result.current.draftTerrainRef.current?.length).toBe(100);
  });

  it('generates procedural terrain', async () => {
    (TerrainGenerator.generateAsync as any).mockImplementation(async (_tw: number, _th: number, _type: string, cb: Function) => {
      cb(new Uint8Array(100).fill(1), 5); // Simulating progress callback
      return new Uint8Array(100).fill(1);
    });
    
    const { result, unmount } = renderHook(() => useTerrainPainter(defaultProps));
    
    await act(async () => {
      await result.current.generateProcedural('pangaea');
    });

    expect(TerrainGenerator.generateAsync).toHaveBeenCalled();
    expect(result.current.draftTerrainRef.current?.[0]).toBe(1);

    // Call cancelGeneration to test cancel logic inside finally block
    act(() => {
      result.current.cancelGeneration();
    });

    // Unmount to trigger useEffect cleanup
    unmount();
  });

  it('handles procedural generation error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (TerrainGenerator.generateAsync as any).mockRejectedValue(new Error('Generation failed'));
    
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    await act(async () => {
      await result.current.generateProcedural('pangaea');
    });

    expect(console.error).toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);
  });

  it('clears canvas', () => {
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    act(() => {
      result.current.clearCanvas();
    });
    
    expect(result.current.draftTerrainRef.current?.[0]).toBe(2); // GRASS is 2
    expect(result.current.isDirty).toBe(false);
  });

  it('commits terrain to worldRef', () => {
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    // Set dirty
    act(() => {
      result.current.setIsDirty(true);
      result.current.isDirtyRef.current = true;
    });

    worldRef.current.scratchpad.terrain = new Uint8Array(100);
    worldRef.current.scratchpad.terrainWidth = 10;
    worldRef.current.scratchpad.terrainHeight = 10;
    
    act(() => {
      result.current.commitTerrain();
    });
    
    expect(worldRef.current.flags.terrainChanged).toBe(true);
    expect(result.current.isDirty).toBe(false);
  });

  it('cancels generation', () => {
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    act(() => {
      result.current.cancelGeneration();
    });
    // This increments an internal ref, hard to assert directly without inspecting, 
    // but we can ensure it doesn't throw.
  });

  it('handles pointer events for painting', () => {
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 10;
    mockCanvas.height = 10;
    Object.defineProperty(mockCanvas, 'offsetWidth', { value: 10 });
    Object.defineProperty(mockCanvas, 'offsetHeight', { value: 10 });
    mockCanvas.getContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
    }) as any;
    
    (result.current.canvasRef as any).current = mockCanvas;

    const mockCursor = document.createElement('div');
    (result.current.cursorRef as any).current = mockCursor;

    const mockEvent = {
      clientX: 50,
      clientY: 50,
      nativeEvent: { offsetX: 5, offsetY: 5 },
      target: { setPointerCapture: vi.fn(), releasePointerCapture: vi.fn() },
      pointerId: 1
    } as any;

    act(() => {
      result.current.handlers.onPointerEnter();
    });
    
    act(() => {
      result.current.handlers.onPointerDown(mockEvent);
    });

    expect(result.current.isDirty).toBe(true);
    
    act(() => {
      result.current.handlers.onPointerMove(mockEvent);
    });

    act(() => {
      result.current.handlers.onPointerUp(mockEvent);
    });

    act(() => {
      result.current.handlers.onPointerLeave();
    });
    
    // Test leave while painting
    act(() => {
      result.current.handlers.onPointerDown(mockEvent);
    });
    act(() => {
      result.current.handlers.onPointerLeave();
    });
  });

  it('provides a cancellation callback to generateAsync', async () => {
    let passedCancelCb: Function | undefined;
    (TerrainGenerator.generateAsync as any).mockImplementation(async (_tw: number, _th: number, _type: string, _cb: Function, cancelCb: Function) => {
      passedCancelCb = cancelCb;
      return new Uint8Array(100).fill(1);
    });
    
    const { result } = renderHook(() => useTerrainPainter(defaultProps));
    
    await act(async () => {
      await result.current.generateProcedural('pangaea');
    });

    expect(passedCancelCb).toBeDefined();
    if (passedCancelCb) {
      expect(passedCancelCb()).toBe(false); // Initially false
      act(() => {
        result.current.cancelGeneration();
      });
      expect(passedCancelCb()).toBe(true); // True after cancel
    }
  });
});
