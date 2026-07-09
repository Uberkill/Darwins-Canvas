import { worldRef } from '../engine/worldRef';
import { spawnCreature, spawnPlant, killCreature } from '../engine/entityManager';
import { buildCreature } from '../engine/creatureFactory';
import { spawnBaby } from '../engine/reproduction';
import { GLOBAL_POPULATION_CAP } from '../constants';
import { preloadImage } from '../renderer/imageCache';
import { audio } from '../engine/audioEngine';
import { useUIStore } from '../store/useUIStore';
import { useEngineStore } from '../store/useEngineStore';

export function useGodTools() {
  const handleGodToolClick = (pt: { x: number, y: number }, hitId: string | null, activeTool: string) => {
    const pending = useEngineStore.getState().pendingCreature;
    if (pending) {
      const creature = buildCreature(pending, worldRef.current.worldWidth, worldRef.current.worldHeight);
      creature.x = pt.x;
      creature.y = pt.y;
      preloadImage(creature.id, creature.drawingData);
      spawnCreature(worldRef.current, creature);
      
      audio.playSpawn();
      if (!worldRef.current.visualEffects) worldRef.current.visualEffects = [];
      worldRef.current.visualEffects.push({
        id: crypto.randomUUID(),
        type: 'SPAWN',
        x: pt.x,
        y: pt.y,
        timer: 1.0,
        maxTimer: 1.0,
        seed: Math.random()
      });
      
      useEngineStore.getState().clearQueue();
      return;
    }

    if (activeTool === 'POINTER') {
      if (hitId) {
        audio.playGodTool('POINTER');
        useUIStore.getState().setSelectedCreatureId(hitId);
        useUIStore.getState().setCameraMode('TRACKING');
        useUIStore.getState().setTargetZoom(3.0);
      } else {
        useUIStore.getState().setSelectedCreatureId(null);
      }
    } else if (activeTool === 'SMITE') {
      if (hitId) {
        audio.playGodTool('SMITE');
        killCreature(worldRef.current, hitId);
        worldRef.current.hoveredEntityId = null;
      }
    } else if (activeTool === 'HEAL') {
      if (hitId) {
        audio.playGodTool('HEAL');
        const target = worldRef.current.creatures.find(c => c.id === hitId);
        if (target) {
          target.health = target.maxHealth;
          target.stamina = target.maxStamina;
          target.hunger = Math.max(target.hunger, 80);
        }
      }
    } else if (activeTool === 'FEED') {
      audio.playGodTool('FEED');
      spawnPlant(worldRef.current, {
        id: crypto.randomUUID(),
        type: 'PLANT',
        x: pt.x,
        y: pt.y,
        growthStage: 0,
        wobblePhase: Math.random() * Math.PI * 2,
      });
    } else if (activeTool === 'LURE') {
      audio.playGodTool('LURE');
      worldRef.current.activeLure = { x: pt.x, y: pt.y, timer: 1 };
    } else if (activeTool === 'CLONE') {
      if (hitId) {
        if (worldRef.current.creatures.length >= GLOBAL_POPULATION_CAP) {
          audio.playGodTool('SMITE'); // error sound
        } else {
          const target = worldRef.current.creatures.find(c => c.id === hitId);
          if (target) {
            const oldHealth = target.health;
            const oldHunger = target.hunger;
            
            const baby = spawnBaby(target, worldRef.current.worldWidth, worldRef.current.worldHeight, target.reproductionCooldown);
            
            target.health = oldHealth;
            target.hunger = oldHunger;
            
            spawnCreature(worldRef.current, baby);
            
            const accum = worldRef.current.analytics.currentSecondAccumulator;
            if (baby.diet === 'CARNIVORE') accum.birthsCarn++;
            else if (baby.diet === 'HERBIVORE') accum.birthsHerb++;
            else if (baby.diet === 'OMNIVORE') accum.birthsOmni++;
            
            audio.playGodTool('CLONE');
            if (!worldRef.current.visualEffects) worldRef.current.visualEffects = [];
            worldRef.current.visualEffects.push({
              id: crypto.randomUUID(),
              type: 'SPAWN',
              x: baby.x,
              y: baby.y,
              timer: 1.0,
              maxTimer: 1.0,
              seed: Math.random()
            });
          }
        }
      }
    }
  };

  const handleGrabStart = (hitId: string, setPointerCapture: () => void) => {
    audio.playGodTool('GRAB');
    worldRef.current.draggedEntityId = hitId;
    const dragged = worldRef.current.creatures.find(c => c.id === hitId);
    if (dragged) dragged.state = 'IDLE';
    setPointerCapture();
  };

  return { handleGodToolClick, handleGrabStart };
}
