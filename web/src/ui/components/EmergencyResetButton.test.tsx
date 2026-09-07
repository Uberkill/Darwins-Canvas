import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmergencyResetButton } from './EmergencyResetButton';
import { saveGame } from '../../utils/saveSystem';
import { useEngineStore } from '../../store/useEngineStore';

vi.mock('../../utils/saveSystem', () => ({
  saveGame: vi.fn(),
}));

vi.mock('../../engine/worldRef', () => ({
  worldRef: {
    current: {}
  }
}));

describe('EmergencyResetButton', () => {
  let locationReloadMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    useEngineStore.setState({ activeSaveSlot: 'slot_1', pendingMapName: 'Map' });
    locationReloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: locationReloadMock },
      writable: true,
      configurable: true,
    });
  });

  it('renders initial state', () => {
    render(<EmergencyResetButton />);
    expect(screen.getByText('Reset App')).toBeTruthy();
  });

  it('shows confirmation when clicked', () => {
    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    expect(screen.getByText('RESET GAME CACHE?')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Yes, Wipe It')).toBeTruthy();
  });

  it('cancels confirmation', () => {
    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('RESET GAME CACHE?')).toBeNull();
    expect(screen.getByText('Reset App')).toBeTruthy();
  });

  it('executes emergency reset without service workers', async () => {
    // Delete navigator.serviceWorker and caches for this test to ensure it handles it gracefully
    Object.defineProperty(globalThis, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue(['cache-1', 'cache-2']),
        delete: vi.fn().mockResolvedValue(true),
      },
      writable: true,
      configurable: true,
    });

    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Wipe It'));
    });
    
    expect(saveGame).toHaveBeenCalledWith('slot_1', expect.anything(), 'Map');
    expect(caches.delete).toHaveBeenCalledWith('cache-1');
    expect(caches.delete).toHaveBeenCalledWith('cache-2');
    expect(locationReloadMock).toHaveBeenCalled();
  });
  
  it('executes emergency reset handling errors in save', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    (saveGame as any).mockRejectedValue(new Error('Save failed'));
    
    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Wipe It'));
    });
    
    expect(console.error).toHaveBeenCalled();
    expect(locationReloadMock).toHaveBeenCalled();
  });

  it('executes emergency reset with service workers', async () => {
    const mockUnregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([{ unregister: mockUnregister }])
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue([]),
      },
      writable: true,
      configurable: true,
    });

    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Wipe It'));
    });
    
    expect(mockUnregister).toHaveBeenCalled();
    expect(locationReloadMock).toHaveBeenCalled();
  });

  it('handles errors when unregistering service workers or deleting caches', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        getRegistrations: vi.fn().mockRejectedValue(new Error('SW Error'))
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, 'caches', {
      value: {
        keys: vi.fn().mockRejectedValue(new Error('Cache Error')),
      },
      writable: true,
      configurable: true,
    });

    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Wipe It'));
    });
    
    expect(console.error).toHaveBeenCalled();
    expect(locationReloadMock).toHaveBeenCalled();
  });
});
