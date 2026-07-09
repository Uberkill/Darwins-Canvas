import { useTrackingStore } from './useTrackingStore';
import { saveToCollection } from '../collection/collectionDB';
import { generateLore } from '../../utils/loreGenerator';
import { audio } from '../../engine/audioEngine';

export class TrackingManager {
  static checkDeath(creature: any) {
    const store = useTrackingStore.getState();
    if (store.trackedIds.has(creature.id)) {
      // 1. Generate educational lore from completed stats
      const loreProfile = generateLore(creature);
      
      // 2. Save snapshot to IndexedDB
      saveToCollection(creature, loreProfile).catch(err => {
        console.error('Failed to save tracked creature:', err);
      });
      
      // 3. Remove from tracked list and notify UI
      store.untrackCreature(creature.id);
      store.incrementUnread();
      
      // 4. Play alert sound
      try {
        audio.playUIPop();
      } catch(e) {}
    }
  }
}
