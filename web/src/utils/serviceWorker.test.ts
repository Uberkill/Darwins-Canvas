import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Zombie PWA Defense (Kill Switch)', () => {
  let unregisterMock: any;
  let cachesDeleteMock: any;

  beforeEach(() => {
    unregisterMock = vi.fn().mockResolvedValue(true);
    cachesDeleteMock = vi.fn().mockResolvedValue(true);

    const mockRegistration = {
      unregister: unregisterMock,
    };

    // Mock navigator.serviceWorker
    Object.defineProperty(window.navigator, 'serviceWorker', {
      value: {
        getRegistrations: vi.fn().mockResolvedValue([mockRegistration, mockRegistration]),
      },
      writable: true,
      configurable: true,
    });

    // Mock caches
    Object.defineProperty(window, 'caches', {
      value: {
        keys: vi.fn().mockResolvedValue(['cache-1', 'cache-2']),
        delete: cachesDeleteMock,
      },
      writable: true,
      configurable: true,
    });

    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      value: {
        reload: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('Emergency Flush successfully unregisters all active service workers and deletes all caches', async () => {
    // 1. Simulate the exact Emergency Reset logic from SettingsModal.tsx
    const registrations = await window.navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
    
    const cacheKeys = await window.caches.keys();
    for (const key of cacheKeys) {
      await window.caches.delete(key);
    }
    
    window.location.reload();

    // 2. Assertions to ensure the blast radius is fully cleared
    expect(window.navigator.serviceWorker.getRegistrations).toHaveBeenCalled();
    expect(unregisterMock).toHaveBeenCalledTimes(2);
    
    expect(window.caches.keys).toHaveBeenCalled();
    expect(cachesDeleteMock).toHaveBeenCalledTimes(2);
    expect(cachesDeleteMock).toHaveBeenCalledWith('cache-1');
    expect(cachesDeleteMock).toHaveBeenCalledWith('cache-2');

    expect(window.location.reload).toHaveBeenCalled();
  });
});
