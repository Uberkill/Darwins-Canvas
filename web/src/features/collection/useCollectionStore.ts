import { create } from 'zustand';
import { getCollectionMetadata, deleteFromCollection } from './collectionDB';
import type { CollectionMeta } from './collectionDB';

interface CollectionState {
  isOpen: boolean;
  metadata: CollectionMeta[];
  isLoading: boolean;
  selectedId: string | null;
  
  // Actions
  openCollection: () => Promise<void>;
  closeCollection: () => void;
  selectCreature: (id: string | null) => void;
  removeCreature: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  isOpen: false,
  metadata: [],
  isLoading: false,
  selectedId: null,

  openCollection: async () => {
    set({ isOpen: true, isLoading: true });
    try {
      const items = await getCollectionMetadata();
      set({ metadata: items, isLoading: false });
    } catch (err) {
      console.error('Failed to load collection metadata', err);
      set({ isLoading: false });
    }
  },

  closeCollection: () => {
    set({ isOpen: false, selectedId: null });
  },

  selectCreature: (id) => {
    set({ selectedId: id });
  },

  removeCreature: async (id) => {
    await deleteFromCollection(id);
    set((state) => ({
      metadata: state.metadata.filter((item) => item.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    }));
  }
}));
