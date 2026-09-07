import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitleScreen } from './TitleScreen';
import { useSaves } from '../hooks/useSaves';
import { useUIStore } from '../store/useUIStore';

// Mock audio
vi.mock('../engine/audioEngine', () => ({
  audio: {
    startBGM: vi.fn(),
  }
}));

// Mock hooks
vi.mock('../hooks/useSaves', () => ({
  useSaves: vi.fn(),
}));

vi.mock('../store/useUIStore', () => {
  let mockZoom = 1;
  const storeFn = vi.fn((selector) => {
    if (typeof selector === 'function') {
      return vi.fn((msg, cb) => cb()); // requestConfirm mock
    }
    return {
      getState: () => ({ 
        setTargetZoom: vi.fn((z) => { mockZoom = z; }),
        isOnboardingOpen: false
      })
    };
  });
  (storeFn as any).getState = () => ({
    setTargetZoom: vi.fn(),
    isOnboardingOpen: false
  });
  return { useUIStore: storeFn };
});

vi.mock('../store/useEngineStore', () => ({
  useEngineStore: {
    getState: () => ({ setPendingMapName: vi.fn() })
  }
}));

// Mock TerrainGenerator
vi.mock('../utils/terrainGenerator', () => ({
  TerrainGenerator: {
    generateAsync: vi.fn().mockResolvedValue(new Uint8Array(100)),
  }
}));

// Mock components
vi.mock('./components/DoodleLayer', () => ({
  DoodleLayer: () => <div data-testid="doodle-layer" />
}));

vi.mock('./components/SettingsModal', () => ({
  SettingsModal: ({ onClose }: any) => <div data-testid="settings-modal"><button onClick={onClose}>Close Settings</button></div>
}));

vi.mock('./components/SaveSlotsModal', () => ({
  SaveSlotsModal: ({ mode, onPlay, onDelete }: any) => (
    <div data-testid="save-slots-modal">
      <span>{mode}</span>
      <button onClick={() => onPlay('slot_1', true)}>Play Slot 1 (New)</button>
      <button onClick={() => onPlay('slot_1', false)}>Play Slot 1 (Load)</button>
      <button onClick={(e) => onDelete(e, 'slot_1')}>Delete Slot 1</button>
    </div>
  )
}));

vi.mock('./components/PatchNotesModal', () => ({
  PatchNotesModal: ({ onClose }: any) => <div data-testid="patch-notes-modal"><button onClick={onClose}>Close Patch Notes</button></div>
}));

vi.mock('./components/WorldSetupModal', () => ({
  WorldSetupModal: ({ onStart, onClose }: any) => (
    <div data-testid="world-setup-modal">
      <button onClick={() => onStart(1, 'plains', 'Test')}>Start World</button>
      <button onClick={onClose}>Close Setup</button>
    </div>
  )
}));

describe('TitleScreen', () => {
  const mockOnPlay = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useSaves as any).mockReturnValue({
      saves: { slot_1: { name: 'Save 1' }, slot_2: null, slot_3: null },
      hasSaves: true,
      mostRecentSlot: 'slot_1',
      executePlay: vi.fn(),
      removeSave: vi.fn(),
    });
  });

  it('renders continue and secondary buttons when saves exist', () => {
    render(<TitleScreen onPlay={mockOnPlay} />);
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Load Game')).toBeInTheDocument();
  });

  it('renders massive Play button when no saves exist', () => {
    (useSaves as any).mockReturnValue({
      saves: { slot_1: null, slot_2: null, slot_3: null },
      hasSaves: false,
      mostRecentSlot: null,
      executePlay: vi.fn(),
      removeSave: vi.fn(),
    });
    render(<TitleScreen onPlay={mockOnPlay} />);
    expect(screen.getByText('Play')).toBeInTheDocument();
  });

  it('opens new game modal', () => {
    render(<TitleScreen onPlay={mockOnPlay} />);
    fireEvent.click(screen.getByText('New Game'));
    expect(screen.getByTestId('save-slots-modal')).toBeInTheDocument();
    expect(screen.getByText('NEW')).toBeInTheDocument();
  });

  it('opens load game modal', () => {
    render(<TitleScreen onPlay={mockOnPlay} />);
    fireEvent.click(screen.getByText('Load Game'));
    expect(screen.getByText('LOAD')).toBeInTheDocument();
  });

  it('opens patch notes', () => {
    render(<TitleScreen onPlay={mockOnPlay} />);
    fireEvent.click(screen.getByTitle('Patch Notes'));
    expect(screen.getByTestId('patch-notes-modal')).toBeInTheDocument();
  });

  it('opens settings', () => {
    render(<TitleScreen onPlay={mockOnPlay} />);
    fireEvent.click(screen.getByTitle('Settings'));
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });
  
  it('handles play request flow for new game', async () => {
    vi.useFakeTimers();
    render(<TitleScreen onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByText('New Game'));
    fireEvent.click(screen.getByText('Play Slot 1 (New)'));
    
    expect(screen.getByTestId('world-setup-modal')).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start World'));
      await Promise.resolve();
    });
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockOnPlay).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('handles play request flow for load game', async () => {
    vi.useFakeTimers();
    render(<TitleScreen onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByText('Load Game'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Play Slot 1 (Load)'));
      await Promise.resolve();
    });
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockOnPlay).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('handles continue flow', async () => {
    vi.useFakeTimers();
    render(<TitleScreen onPlay={mockOnPlay} />);
    
    await act(async () => {
      fireEvent.click(screen.getByText('Continue'));
      await Promise.resolve();
    });
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockOnPlay).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('handles frictionless play when no saves exist', async () => {
    vi.useFakeTimers();
    (useSaves as any).mockReturnValue({
      saves: { slot_1: null, slot_2: null, slot_3: null },
      hasSaves: false,
      mostRecentSlot: null,
      executePlay: vi.fn(),
      removeSave: vi.fn(),
    });
    render(<TitleScreen onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByText('Play'));
    
    // Goes straight to World Setup Modal
    expect(screen.getByTestId('world-setup-modal')).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(screen.getByText('Start World'));
      await Promise.resolve();
    });
    
    act(() => {
      vi.runAllTimers();
    });
    
    expect(mockOnPlay).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('handles delete save flow', () => {
    const mockRemoveSave = vi.fn();
    (useSaves as any).mockReturnValue({
      saves: { slot_1: { name: 'Save 1' } },
      hasSaves: true,
      executePlay: vi.fn(),
      removeSave: mockRemoveSave,
    });
    render(<TitleScreen onPlay={mockOnPlay} />);
    
    fireEvent.click(screen.getByText('Load Game'));
    fireEvent.click(screen.getByText('Delete Slot 1'));
    
    // our mock UI store requestConfirm immediately calls the callback
    expect(mockRemoveSave).toHaveBeenCalledWith('slot_1');
  });
});
