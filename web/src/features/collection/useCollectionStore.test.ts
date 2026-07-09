import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { useCollectionStore } from './useCollectionStore';
import { saveToCollection, getCollectionDB } from './collectionDB';

describe('useCollectionStore', () => {
  beforeEach(async () => {
    const db = await getCollectionDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['collection_meta', 'collection_blobs'], 'readwrite');
      tx.objectStore('collection_meta').clear();
      tx.objectStore('collection_blobs').clear();
      tx.oncomplete = () => {
        useCollectionStore.setState({ isOpen: false, metadata: [], isLoading: false, selectedId: null });
        resolve(undefined);
      };
    });
  });

  it('loads metadata when opened', async () => {
    const mockCreature = {
      name: 'StoreTest',
      size: 'LARGE',
      movement: 'HOPPER',
      diet: 'OMNIVORE',
      drawingData: 'data:image/png;base64,mock',
      decals: [],
    };
    await saveToCollection(mockCreature);

    expect(useCollectionStore.getState().metadata.length).toBe(0);
    
    await useCollectionStore.getState().openCollection();
    
    expect(useCollectionStore.getState().isOpen).toBe(true);
    expect(useCollectionStore.getState().metadata.length).toBe(1);
    expect(useCollectionStore.getState().metadata[0].name).toBe('StoreTest');
  });

  it('removes creature correctly', async () => {
    await saveToCollection({
      name: 'ToRemove', size: 'SMALL', movement: 'PACER', diet: 'CARNIVORE', drawingData: 'x', decals: []
    });

    await useCollectionStore.getState().openCollection();
    const id = useCollectionStore.getState().metadata[0].id;
    useCollectionStore.getState().selectCreature(id);

    expect(useCollectionStore.getState().selectedId).toBe(id);

    await useCollectionStore.getState().removeCreature(id);

    expect(useCollectionStore.getState().metadata.length).toBe(0);
    expect(useCollectionStore.getState().selectedId).toBeNull();
  });
});
