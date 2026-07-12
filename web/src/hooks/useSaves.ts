import { useState, useEffect } from 'react';
import { listSaves, deleteGame, loadGame } from '../utils/saveSystem';
import type { SaveSlotMetadata } from '../utils/saveSystem';
import { worldRef, setWorldDimensions, centerCamera, getAutoFitZoom } from '../engine/worldRef';
import { getWorldWidth, getWorldHeight } from '../constants';
import { setEntities, clearEntities } from '../engine/entityManager';
import { useEngineStore } from '../store/useEngineStore';
import { useUIStore } from '../store/useUIStore';

export function useSaves() {
  const [saves, setSaves] = useState<Record<string, SaveSlotMetadata | null>>({
    'slot_1': null,
    'slot_2': null,
    'slot_3': null,
  });

  useEffect(() => {
    async function fetchSaves() {
      const allSaves = await listSaves();
      const newSaves: Record<string, SaveSlotMetadata | null> = { 'slot_1': null, 'slot_2': null, 'slot_3': null };
      for (const save of allSaves) {
        if (newSaves[save.id] !== undefined) {
          newSaves[save.id] = save;
        }
      }
      setSaves(newSaves);
    }
    fetchSaves();
  }, []);

  const hasSaves = Object.values(saves).some(s => s !== null);

  const mostRecentSlot = Object.values(saves).reduce<string | null>((recent, save) => {
    if (!save) return recent;
    if (!recent) return save.id;
    const recentSave = saves[recent];
    if (recentSave && save.lastSaved > recentSave.lastSaved) {
      return save.id;
    }
    return recent;
  }, null);

  const executePlay = async (slotId: string, isNew: boolean) => {
    useEngineStore.getState().setActiveSaveSlot(slotId);
    useEngineStore.getState().setTimeScale(1.0);
    
    if (!isNew) {
      const save = await loadGame(slotId);
      if (save) {
        useEngineStore.getState().setPendingMapName(save.name || `Ecosystem ${slotId.replace('slot_', '')}`);
        setEntities(worldRef.current, save.creatures || [], save.plants || []);
        worldRef.current.timeOfDay = save.timeOfDay || 0.1;
        worldRef.current.weather = save.weather || 'CLEAR';
        worldRef.current.totalTime = save.totalTime || 0;
        const saveMult = save.mapSizeMultiplier || 1;
        worldRef.current.mapSizeMultiplier = saveMult;
        
        // Use explicitly saved dimensions, or fallback to constants for older saves
        const w = save.worldWidth || getWorldWidth() * saveMult;
        const h = save.worldHeight || getWorldHeight() * saveMult;
        setWorldDimensions(w, h);
        
        if (save.terrain) {
          worldRef.current.scratchpad.terrain = save.terrain;
          worldRef.current.scratchpad.terrainWidth = save.terrainWidth;
          worldRef.current.scratchpad.terrainHeight = save.terrainHeight;
          worldRef.current.flags.terrainChanged = true;
        }

        centerCamera();
        const optimalZoom = getAutoFitZoom();
        useUIStore.getState().setTargetZoom(optimalZoom);
        worldRef.current.camera.zoom = optimalZoom;
      }
    } else {
      clearEntities(worldRef.current);
      worldRef.current.timeOfDay = 0.1;
      worldRef.current.totalTime = 0;
      // mapSizeMultiplier is set BEFORE executePlay is called via TitleScreen
      useUIStore.getState().openOnboarding();
    }
  };

  const removeSave = async (slotId: string) => {
    await deleteGame(slotId);
    setSaves(prev => ({ ...prev, [slotId]: null }));
  };

  return {
    saves,
    hasSaves,
    mostRecentSlot,
    executePlay,
    removeSave
  };
}
