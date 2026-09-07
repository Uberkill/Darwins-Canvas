import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CheckForUpdatesButton } from './CheckForUpdatesButton';

describe('CheckForUpdatesButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders idle state', () => {
    render(<CheckForUpdatesButton />);
    expect(screen.getByText('Check for Updates')).toBeTruthy();
  });

  it('handles lack of serviceWorker', async () => {
    // navigator.serviceWorker is missing in standard jsdom unless mocked
    render(<CheckForUpdatesButton />);
    const btn = screen.getByText('Check for Updates');
    
    await act(async () => {
      fireEvent.click(btn);
    });
    
    expect(screen.getByText('Check Failed')).toBeTruthy();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.getByText('Check for Updates')).toBeTruthy();
  });

  it('handles update success', async () => {
    const mockUpdate = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({ update: mockUpdate }),
      },
      writable: true,
      configurable: true,
    });

    render(<CheckForUpdatesButton />);
    const btn = screen.getByText('Check for Updates');
    
    await act(async () => {
      fireEvent.click(btn);
    });
    
    // Status should be checking before timeout
    expect(screen.getByText('Checking...')).toBeTruthy();
    
    await act(async () => {
      vi.advanceTimersByTime(800);
    });
    
    expect(screen.getByText('Up to Date')).toBeTruthy();
    expect(mockUpdate).toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.getByText('Check for Updates')).toBeTruthy();
  });

  it('handles update failure', async () => {
    const mockUpdate = vi.fn().mockRejectedValue(new Error('Failed'));
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        ready: Promise.resolve({ update: mockUpdate }),
      },
      writable: true,
      configurable: true,
    });

    vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<CheckForUpdatesButton />);
    const btn = screen.getByText('Check for Updates');
    
    await act(async () => {
      fireEvent.click(btn);
    });
    
    expect(screen.getByText('Check Failed')).toBeTruthy();
    expect(console.error).toHaveBeenCalled();
    
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    
    expect(screen.getByText('Check for Updates')).toBeTruthy();
  });
});
