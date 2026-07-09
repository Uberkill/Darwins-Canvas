import { create } from 'zustand';

interface TrackingState {
  trackedIds: Set<string>;
  unreadReports: number;
  tagCreature: (id: string) => void;
  untrackCreature: (id: string) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export const MAX_TRACKED = 3;

export const useTrackingStore = create<TrackingState>((set) => ({
  trackedIds: new Set<string>(),
  unreadReports: 0,
  tagCreature: (id) => set((state) => {
    if (state.trackedIds.has(id) || state.trackedIds.size >= MAX_TRACKED) {
      return state;
    }
    const next = new Set(state.trackedIds);
    next.add(id);
    return { trackedIds: next };
  }),
  untrackCreature: (id) => set((state) => {
    const next = new Set(state.trackedIds);
    next.delete(id);
    return { trackedIds: next };
  }),
  incrementUnread: () => set((state) => ({ unreadReports: state.unreadReports + 1 })),
  clearUnread: () => set({ unreadReports: 0 })
}));
