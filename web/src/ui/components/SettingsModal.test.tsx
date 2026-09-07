import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsModal } from './SettingsModal';
import { useSettingsStore } from '../../store/useSettingsStore';

describe('SettingsModal', () => {
  beforeEach(() => {
    useSettingsStore.setState({
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      uiScale: 1.0,
    });
  });

  it('renders settings inputs correctly', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);
    
    expect(screen.getByText('Settings')).toBeTruthy();
    expect(screen.getByText('Master Volume')).toBeTruthy();
    expect(screen.getByText('SFX Volume')).toBeTruthy();
    expect(screen.getByText('Music Volume')).toBeTruthy();
  });

  it('updates master volume', () => {
    render(<SettingsModal onClose={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    // sliders[0] is masterVolume
    fireEvent.change(sliders[0], { target: { value: '0.7' } });
    expect(useSettingsStore.getState().masterVolume).toBe(0.7);
  });

  it('updates sfx volume', () => {
    render(<SettingsModal onClose={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    // sliders[1] is sfxVolume
    fireEvent.change(sliders[1], { target: { value: '0.6' } });
    expect(useSettingsStore.getState().sfxVolume).toBe(0.6);
  });

  it('updates music volume', () => {
    render(<SettingsModal onClose={vi.fn()} />);
    const sliders = screen.getAllByRole('slider');
    // sliders[2] is musicVolume
    fireEvent.change(sliders[2], { target: { value: '0.3' } });
    expect(useSettingsStore.getState().musicVolume).toBe(0.3);
  });

  it('updates ui scale via buttons', () => {
    render(<SettingsModal onClose={vi.fn()} />);
    const scaleBtn = screen.getByText('1.25x');
    fireEvent.click(scaleBtn);
    expect(useSettingsStore.getState().uiScale).toBe(1.25);
  });

  it('calls onClose when Done is clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal onClose={onClose} />);
    const doneBtn = screen.getByText('Done');
    fireEvent.click(doneBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
