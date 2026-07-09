import { useRef, useState, useCallback } from 'react';
import type { Decal } from '../types';

const MAX_UNDO_STEPS = 10;

export interface UndoSnapshot {
  snapshotCanvas: HTMLCanvasElement;
  decals: Decal[];
}

export function useCanvasHistory() {
  const undoStack = useRef<UndoSnapshot[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const saveSnapshot = useCallback((canvas: HTMLCanvasElement, currentDecals: Decal[]) => {
    const snapshotCanvas = document.createElement('canvas');
    snapshotCanvas.width = canvas.width;
    snapshotCanvas.height = canvas.height;
    snapshotCanvas.getContext('2d')!.drawImage(canvas, 0, 0);
    undoStack.current.push({ snapshotCanvas, decals: [...currentDecals] });
    if (undoStack.current.length > MAX_UNDO_STEPS) {
      const removed = undoStack.current.shift();
      if (removed && removed.snapshotCanvas) {
        removed.snapshotCanvas.width = 0;
        removed.snapshotCanvas.height = 0;
      }
    }
    setCanUndo(true);
  }, []);

  const undo = useCallback((
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    setDecals: (decals: Decal[]) => void
  ) => {
    if (undoStack.current.length === 0) return null;
    
    const snapshot = undoStack.current.pop()!;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(snapshot.snapshotCanvas, 0, 0);
    setDecals(snapshot.decals);
    
    setCanUndo(undoStack.current.length > 0);
    
    return snapshot;
  }, []);

  const clearHistory = useCallback(() => {
    undoStack.current = [];
    setCanUndo(false);
  }, []);

  return { saveSnapshot, undo, canUndo, clearHistory };
}
