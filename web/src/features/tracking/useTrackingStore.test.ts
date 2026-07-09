import { describe, it, expect, beforeEach } from 'vitest';
import { useTrackingStore, MAX_TRACKED } from './useTrackingStore';

describe('useTrackingStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTrackingStore.setState({
      trackedIds: new Set<string>(),
      unreadReports: 0
    });
  });

  it('allows tagging creatures up to MAX_TRACKED', () => {
    const store = useTrackingStore.getState();
    
    // Tag 3 creatures
    store.tagCreature('c1');
    store.tagCreature('c2');
    store.tagCreature('c3');
    
    expect(useTrackingStore.getState().trackedIds.size).toBe(3);
    expect(useTrackingStore.getState().trackedIds.has('c1')).toBe(true);
    expect(useTrackingStore.getState().trackedIds.has('c3')).toBe(true);
  });

  it('prevents tagging beyond MAX_TRACKED', () => {
    const store = useTrackingStore.getState();
    
    // Tag 3 creatures
    store.tagCreature('c1');
    store.tagCreature('c2');
    store.tagCreature('c3');
    
    // Attempt to tag 4th
    store.tagCreature('c4');
    
    expect(useTrackingStore.getState().trackedIds.size).toBe(MAX_TRACKED);
    expect(useTrackingStore.getState().trackedIds.has('c4')).toBe(false);
  });

  it('allows untracking creatures and freeing capacity', () => {
    const store = useTrackingStore.getState();
    
    store.tagCreature('c1');
    store.tagCreature('c2');
    store.tagCreature('c3');
    
    // Untrack one
    useTrackingStore.getState().untrackCreature('c2');
    expect(useTrackingStore.getState().trackedIds.size).toBe(2);
    expect(useTrackingStore.getState().trackedIds.has('c2')).toBe(false);
    
    // Can now tag a new one
    useTrackingStore.getState().tagCreature('c4');
    expect(useTrackingStore.getState().trackedIds.size).toBe(3);
    expect(useTrackingStore.getState().trackedIds.has('c4')).toBe(true);
  });
});
