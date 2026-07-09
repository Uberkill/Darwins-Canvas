import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { saveToCollection, getCollectionMetadata, getCollectionBlob, deleteFromCollection, getCollectionDB } from './collectionDB';

describe('collectionDB', () => {
  beforeEach(async () => {
    // Clear the DB before each test
    const db = await getCollectionDB();
    return new Promise((resolve) => {
      const tx = db.transaction(['collection_meta', 'collection_blobs'], 'readwrite');
      tx.objectStore('collection_meta').clear();
      tx.objectStore('collection_blobs').clear();
      tx.oncomplete = () => resolve(undefined);
    });
  });

  it('saves and retrieves metadata and blob correctly', async () => {
    const mockCreature = {
      name: 'TestCreature',
      size: 'MEDIUM',
      movement: 'CRAWLER',
      diet: 'HERBIVORE',
      drawingData: 'data:image/png;base64,mock',
      decals: [],
    };

    await saveToCollection(mockCreature);

    const meta = await getCollectionMetadata();
    expect(meta.length).toBe(1);
    expect(meta[0].name).toBe('TestCreature');
    expect(meta[0].diet).toBe('HERBIVORE');

    const id = meta[0].id;
    const blob = await getCollectionBlob(id);
    expect(blob).not.toBeNull();
    expect(blob!.drawingData).toBe('data:image/png;base64,mock');
  });

  it('handles legacy saves gracefully by providing defaults', async () => {
    const mockLegacyCreature = {
      name: 'LegacyCreature',
      size: 'SMALL',
      movement: 'CRAWLER',
      diet: 'HERBIVORE',
      drawingData: 'data:image/png;base64,mock',
      // No kills, no foodEaten, no age
    };

    // Save with no lore provided
    await saveToCollection(mockLegacyCreature);

    const meta = await getCollectionMetadata();
    expect(meta.length).toBe(1);
    expect(meta[0].kills).toBe(0);
    expect(meta[0].foodEaten).toBe(0);
    expect(meta[0].ageAtSave).toBe(0);
    expect(meta[0].loreProfile).toBeUndefined();
  });

  it('deletes from collection correctly', async () => {
    const mockCreature = {
      name: 'ToDelete',
      size: 'SMALL',
      movement: 'PACER',
      diet: 'CARNIVORE',
      drawingData: 'data:image/png;base64,delete',
      decals: [],
    };

    await saveToCollection(mockCreature);
    let meta = await getCollectionMetadata();
    expect(meta.length).toBe(1);
    const id = meta[0].id;

    await deleteFromCollection(id);

    meta = await getCollectionMetadata();
    expect(meta.length).toBe(0);

    const blob = await getCollectionBlob(id);
    expect(blob).toBeNull();
  });
});
