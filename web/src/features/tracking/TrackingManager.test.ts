import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrackingManager } from './trackingManager';
import { useTrackingStore } from './useTrackingStore';
import { saveToCollection } from '../collection/collectionDB';
import { generateLore } from '../../utils/loreGenerator';
import { audio } from '../../engine/audioEngine';

vi.mock('./useTrackingStore');
vi.mock('../collection/collectionDB');
vi.mock('../../utils/loreGenerator');
vi.mock('../../engine/audioEngine');

describe('TrackingManager', () => {
  const mockUntrack = vi.fn();
  const mockIncrement = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useTrackingStore.getState as any) = vi.fn(() => ({
      trackedIds: new Set(['tracked-1']),
      untrackCreature: mockUntrack,
      incrementUnread: mockIncrement,
    }));
    (saveToCollection as any).mockResolvedValue(undefined);
    (generateLore as any).mockReturnValue('Mock lore');
  });

  it('ignores untracked creatures', () => {
    TrackingManager.checkDeath({ id: 'untracked-1' });
    expect(generateLore).not.toHaveBeenCalled();
    expect(saveToCollection).not.toHaveBeenCalled();
    expect(mockUntrack).not.toHaveBeenCalled();
  });

  it('processes tracked creature death', () => {
    TrackingManager.checkDeath({ id: 'tracked-1' });
    expect(generateLore).toHaveBeenCalledWith({ id: 'tracked-1' });
    expect(saveToCollection).toHaveBeenCalledWith({ id: 'tracked-1' }, 'Mock lore');
    expect(mockUntrack).toHaveBeenCalledWith('tracked-1');
    expect(mockIncrement).toHaveBeenCalled();
    expect(audio.playUIPop).toHaveBeenCalled();
  });

  it('handles saveToCollection error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    (saveToCollection as any).mockRejectedValue(new Error('DB error'));
    
    TrackingManager.checkDeath({ id: 'tracked-1' });
    
    // Wait a tick for the rejected promise to be caught
    await new Promise(r => setTimeout(r, 0));
    
    expect(consoleError).toHaveBeenCalledWith('Failed to save tracked creature:', expect.any(Error));
    consoleError.mockRestore();
  });

  it('ignores audio errors', () => {
    (audio.playUIPop as any).mockImplementation(() => { throw new Error('Audio failed') });
    expect(() => TrackingManager.checkDeath({ id: 'tracked-1' })).not.toThrow();
  });
});
