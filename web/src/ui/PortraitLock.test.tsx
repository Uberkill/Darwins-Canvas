import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { PortraitLock } from './PortraitLock';

describe('PortraitLock Component', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when in landscape mode', () => {
    const { container } = render(<PortraitLock />);
    expect(container.firstChild).toBeNull();
  });

  it('renders portrait lock overlay when in portrait mode', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 812 });
    render(<PortraitLock />);
    expect(screen.getByText('Please Rotate Your Device')).toBeInTheDocument();
  });

  it('dynamically responds to window resize events', () => {
    const { container } = render(<PortraitLock />);
    expect(container.firstChild).toBeNull();

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 812 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByText('Please Rotate Your Device')).toBeInTheDocument();

    act(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 812 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 });
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.firstChild).toBeNull();
  });

  it('hides the lock screen if keyboard opens in portrait mode', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 812 });
    
    const { container } = render(<PortraitLock />);
    expect(screen.getByText('Please Rotate Your Device')).toBeInTheDocument();

    act(() => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      window.dispatchEvent(new Event('resize'));
    });

    expect(container.firstChild).toBeNull();

    act(() => {
      (document.activeElement as HTMLElement)?.blur();
      window.dispatchEvent(new Event('focusout'));
      vi.advanceTimersByTime(150);
    });

    expect(screen.getByText('Please Rotate Your Device')).toBeInTheDocument();
  });
});

