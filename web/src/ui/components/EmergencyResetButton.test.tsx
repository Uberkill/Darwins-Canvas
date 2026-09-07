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
    
    expect(screen.getByText('FACTORY RESET APP?')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Yes, Hard Reset')).toBeTruthy();
  });

  it('cancels confirmation', () => {
    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('RESET GAME CACHE?')).toBeNull();
    expect(screen.getByText('Reset App')).toBeTruthy();
  });

  it('executes emergency reset without service workers', async () => {
    // Mock caches
    Object.defineProperty(globalThis, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue(['cache-1', 'cache-2']),
        delete: vi.fn().mockResolvedValue(true),
      },
      writable: true,
      configurable: true,
    });
    
    // Mock indexedDB
    const mockDeleteDatabase = vi.fn();
    Object.defineProperty(globalThis, 'indexedDB', {
      value: {
        databases: vi.fn().mockResolvedValue([{ name: 'darwins-canvas-saves' }, { name: 'darwins-canvas-collection' }]),
        deleteDatabase: mockDeleteDatabase,
      },
      writable: true,
      configurable: true,
    });
    
    // Mock localStorage / sessionStorage
    const mockLocalStorageClear = vi.fn();
    const mockSessionStorageClear = vi.fn();
    Object.defineProperty(globalThis, 'localStorage', {
      value: { clear: mockLocalStorageClear },
      writable: true,
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: { clear: mockSessionStorageClear },
      writable: true,
    });

    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Hard Reset'));
    });
    
    expect(mockDeleteDatabase).toHaveBeenCalledWith('darwins-canvas-saves');
    expect(mockDeleteDatabase).toHaveBeenCalledWith('darwins-canvas-collection');
    expect(mockLocalStorageClear).toHaveBeenCalled();
    expect(mockSessionStorageClear).toHaveBeenCalled();
    
    expect(caches.delete).toHaveBeenCalledWith('cache-1');
    expect(caches.delete).toHaveBeenCalledWith('cache-2');
    expect(locationReloadMock).toHaveBeenCalled();
  });
  
  it('executes emergency reset handling errors in indexeddb', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockDeleteDatabase = vi.fn();
    Object.defineProperty(globalThis, 'indexedDB', {
      value: {
        databases: vi.fn().mockRejectedValue(new Error('IDB failed')),
        deleteDatabase: mockDeleteDatabase,
      },
      writable: true,
      configurable: true,
    });
    
    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Hard Reset'));
    });
    
    expect(console.error).toHaveBeenCalled();
    expect(mockDeleteDatabase).toHaveBeenCalledWith('darwins-canvas-saves'); // fallback called
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
    
    Object.defineProperty(globalThis, 'indexedDB', {
      value: {
        databases: vi.fn().mockResolvedValue([]),
        deleteDatabase: vi.fn(),
      },
      writable: true,
      configurable: true,
    });

    render(<EmergencyResetButton />);
    fireEvent.click(screen.getByText('Reset App'));
    
    await act(async () => {
      fireEvent.click(screen.getByText('Yes, Hard Reset'));
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
      fireEvent.click(screen.getByText('Yes, Hard Reset'));
    });
    
    expect(console.error).toHaveBeenCalled();
    expect(locationReloadMock).toHaveBeenCalled();
  });
});
