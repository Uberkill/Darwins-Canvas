import { useState, useRef, useEffect, useCallback } from 'react';
import { TERRAIN_CELL_SIZE, worldRef } from '../engine/worldRef';
import { TerrainGenerator, type MapType } from '../utils/terrainGenerator';

type TerrainType = 'WATER' | 'DIRT' | 'GRASS' | 'ROCK';

const TERRAIN_VALUES: Record<TerrainType, number> = {
  WATER: 0,
  DIRT: 1,
  GRASS: 2,
  ROCK: 3,
};

const TERRAIN_COLORS: Record<TerrainType, string> = {
  WATER: '#4CA8D1', // Soft blue
  DIRT: '#D6A675',  // Soft brown
  GRASS: '#84C270', // Soft green
  ROCK: '#979A9E',  // Soft gray
};

interface UseTerrainPainterProps {
  worldDims: { w: number, h: number };
  minimapScale: number;
  activeBrush: TerrainType;
  brushSize: number;
  isPaintingAllowed?: boolean; // false for procedural preview mode where user can't paint
}

export function useTerrainPainter({
  worldDims,
  minimapScale,
  activeBrush,
  brushSize,
  isPaintingAllowed = true,
}: UseTerrainPainterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const draftTerrainRef = useRef<Uint8Array | null>(null);
  
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  
  const isPainting = useRef(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const generationIdRef = useRef(0);
  const pendingAnimationFrame = useRef<number | null>(null);
  const rowsReadyRef = useRef<number>(0); // how many rows of terrain are ready to draw

  useEffect(() => {
    return () => {
      if (pendingAnimationFrame.current !== null) {
        cancelAnimationFrame(pendingAnimationFrame.current);
      }
    };
  }, []);

  const commitTerrain = useCallback(() => {
    if (!draftTerrainRef.current || !isDirtyRef.current) return;
    
    const liveTerrain = worldRef.current.scratchpad.terrain;
    const liveW = worldRef.current.scratchpad.terrainWidth;
    const liveH = worldRef.current.scratchpad.terrainHeight;
    
    const draftW = Math.ceil(worldDims.w / TERRAIN_CELL_SIZE);
    const draftH = Math.ceil(worldDims.h / TERRAIN_CELL_SIZE);

    if (liveTerrain && liveTerrain.length === draftTerrainRef.current.length && liveW === draftW && liveH === draftH) {
      liveTerrain.set(draftTerrainRef.current);
      worldRef.current.flags.terrainChanged = true;
    } else {
      console.warn("Terrain dimension mismatch on commit. Skipping inject.");
    }
    
    setIsDirty(false);
    isDirtyRef.current = false;
  }, [worldDims.w, worldDims.h]);

  const lastRenderTime = useRef(0);
  // Store renderMinimap in a ref so rAF closures and generation callbacks always call
  // the LATEST version without stale-closure bugs. Never use useCallback for this.
  const renderMinimapRef = useRef<() => void>(() => {});

  // Assign the implementation every render so it always captures current worldDims
  renderMinimapRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const terrain = draftTerrainRef.current;
    const tw = Math.ceil(worldDims.w / TERRAIN_CELL_SIZE);
    const th = Math.ceil(worldDims.h / TERRAIN_CELL_SIZE);
    if (!terrain || !tw || !th) return;

    // Fill background as water first
    ctx.fillStyle = TERRAIN_COLORS.WATER;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // rowsReadyRef = 0 means all rows are valid (initial state or post-generation).
    // During generation, it holds the count of rows that have been computed.
    const rowsToRender = rowsReadyRef.current > 0 ? rowsReadyRef.current : th;

    for (let y = 0; y < rowsToRender; y++) {
      for (let x = 0; x < tw; x++) {
        const val = terrain[y * tw + x];
        if (val === 0) continue;
        switch (val) {
          case 1: ctx.fillStyle = TERRAIN_COLORS.DIRT; break;
          case 2: ctx.fillStyle = TERRAIN_COLORS.GRASS; break;
          case 3: ctx.fillStyle = TERRAIN_COLORS.ROCK; break;
          default: ctx.fillStyle = TERRAIN_COLORS.DIRT; break;
        }
        ctx.fillRect(x, y, 1, 1);
      }
    }
    lastRenderTime.current = performance.now();
  };

  // Stable wrapper that delegates to the always-current ref implementation.
  // This is what callers outside the hook use.
  const renderMinimap = useCallback(() => renderMinimapRef.current(), []);

  // Sync with world bounds, or init blank
  useEffect(() => {
    const tw = Math.ceil(worldDims.w / TERRAIN_CELL_SIZE);
    const th = Math.ceil(worldDims.h / TERRAIN_CELL_SIZE);
    const totalCells = tw * th;

    if (!draftTerrainRef.current || draftTerrainRef.current.length !== totalCells) {
      const newTerrain = new Uint8Array(totalCells);
      newTerrain.fill(2); // Grass default
      
      const liveTerrain = worldRef.current.scratchpad.terrain;
      const liveW = worldRef.current.scratchpad.terrainWidth;
      const liveH = worldRef.current.scratchpad.terrainHeight;
      
      if (liveTerrain && liveTerrain.length === totalCells && liveW === tw && liveH === th) {
        newTerrain.set(liveTerrain);
      }
      
      draftTerrainRef.current = newTerrain;
      setIsDirty(false);
      isDirtyRef.current = false;
    }
    
    if (canvasRef.current) {
      const tw = Math.ceil(worldDims.w / TERRAIN_CELL_SIZE);
      const th = Math.ceil(worldDims.h / TERRAIN_CELL_SIZE);
      canvasRef.current.width = tw;
      canvasRef.current.height = th;
      // rowsReadyRef = 0 means "render all rows" — correct for a fully-initialized buffer
      rowsReadyRef.current = 0;
      renderMinimapRef.current();
    }
  }, [worldDims.w, worldDims.h]);


  const paintTerrain = useCallback((clientX: number, clientY: number, nativeEvent?: MouseEvent) => {
    if (!isPaintingAllowed || !nativeEvent) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Using native offsetX/Y is 100% immune to CSS flexbox and bounding rect scaling issues!
    const mx = (nativeEvent.offsetX / canvas.offsetWidth) * canvas.width;
    const my = (nativeEvent.offsetY / canvas.offsetHeight) * canvas.height;

    const tw = canvas.width;
    const th = canvas.height;
    const terrain = draftTerrainRef.current;
    if (!terrain || !tw || !th) return;

    // cellW and cellH are exactly 1.0 because the canvas resolution matches the grid exactly
    const gridX = Math.floor(mx);
    const gridY = Math.floor(my);

    const targetVal = TERRAIN_VALUES[activeBrush];
    const ctx = canvas.getContext('2d', { alpha: false });
    if (ctx) ctx.fillStyle = TERRAIN_COLORS[activeBrush];

    let painted = false;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy <= brushSize * brushSize) {
          const px = gridX + dx;
          const py = gridY + dy;
          if (px >= 0 && px < tw && py >= 0 && py < th) {
            const idx = py * tw + px;
            if (terrain[idx] !== targetVal) {
              terrain[idx] = targetVal;
              painted = true;
              if (ctx) {
                ctx.fillRect(px, py, 1, 1);
              }
            }
          }
        }
      }
    }

    if (painted && !isDirtyRef.current) {
      setIsDirty(true);
      isDirtyRef.current = true;
    }
  }, [worldDims.w, worldDims.h, activeBrush, brushSize, isPaintingAllowed]);

  const updateCursorPosition = useCallback((clientX: number, clientY: number, nativeEvent?: MouseEvent) => {
    if (!cursorRef.current || !canvasRef.current || !isPaintingAllowed || !nativeEvent) return;
    const canvas = canvasRef.current;
    
    // The radius in internal canvas pixels is exactly brushSize (since 1 cell = 1 pixel)
    const radiusPx = brushSize * (canvas.offsetWidth / canvas.width);
    
    cursorRef.current.style.width = `${radiusPx * 2}px`;
    cursorRef.current.style.height = `${radiusPx * 2}px`;
    cursorRef.current.style.transform = `translate(${nativeEvent.offsetX - radiusPx}px, ${nativeEvent.offsetY - radiusPx}px)`;
  }, [brushSize, isPaintingAllowed]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGeneratingRef.current || !isPaintingAllowed) return;
    isPainting.current = true;
    paintTerrain(e.clientX, e.clientY, e.nativeEvent);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    updateCursorPosition(e.clientX, e.clientY, e.nativeEvent);
    if (!isPainting.current || isGeneratingRef.current || !isPaintingAllowed) return;
    paintTerrain(e.clientX, e.clientY, e.nativeEvent);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isPainting.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const handlePointerEnter = () => {
    if (cursorRef.current && isPaintingAllowed) {
      cursorRef.current.style.opacity = '0.5';
    }
  };

  const handlePointerLeave = () => {
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '0';
    }
    if (isPainting.current) {
      isPainting.current = false;
    }
  };

  const cancelGeneration = useCallback(() => {
    generationIdRef.current++;
  }, []);

  const generateProcedural = useCallback(async (mapType: MapType, forceClean = false) => {

    const tw = Math.ceil(worldDims.w / TERRAIN_CELL_SIZE);
    const th = Math.ceil(worldDims.h / TERRAIN_CELL_SIZE);
    if (!tw || !th) return;

    rowsReadyRef.current = 0; // reset: 0 means "render all valid rows"
    setIsGenerating(true);
    isGeneratingRef.current = true;
    const currentId = ++generationIdRef.current;

    try {
      const newTerrain = await TerrainGenerator.generateAsync(
        tw,
        th,
        mapType,
        (progressTerrain, rowsDone) => {
          if (currentId !== generationIdRef.current) return; // already cancelled
          draftTerrainRef.current = progressTerrain;
          rowsReadyRef.current = rowsDone; // only draw rows that are actually computed
          renderMinimapRef.current(); // call the ref directly — always the latest version, no stale closure
        },
        () => currentId !== generationIdRef.current
      );

      if (newTerrain && currentId === generationIdRef.current) {
        draftTerrainRef.current = newTerrain;
        rowsReadyRef.current = 0; // 0 = render ALL rows (generation complete)
        // *** Set isGeneratingRef to false BEFORE the final render ***
        // This guarantees the minimap render is never blocked by the old throttle logic.
        isGeneratingRef.current = false;
        renderMinimapRef.current();
      }
    } catch (e) {
      console.error("Terrain generation failed", e);
    } finally {
      if (currentId === generationIdRef.current) {
        setIsGenerating(false);
        isGeneratingRef.current = false; // idempotent
      }
    }
  }, [worldDims.w, worldDims.h]);

  const clearCanvas = useCallback(() => {
    if (draftTerrainRef.current) {
        draftTerrainRef.current.fill(2); // Grass
        rowsReadyRef.current = 0; // render all rows
        renderMinimapRef.current();
        setIsDirty(false);
        isDirtyRef.current = false;
    }
  }, [worldDims.w, worldDims.h]);

  return {
    canvasRef,
    cursorRef,
    draftTerrainRef,
    isDirty,
    setIsDirty,
    isGenerating,
    generateProcedural,
    cancelGeneration,
    clearCanvas,
    commitTerrain,
    renderMinimap,
    isDirtyRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onPointerEnter: handlePointerEnter,
      onPointerLeave: handlePointerLeave,
    }
  };
}
