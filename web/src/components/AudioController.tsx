import { useEffect } from 'react';
import { useEngineStore } from '../store/useEngineStore';
import { useUIStore } from '../store/useUIStore';
import { audio } from '../engine/audioEngine';
import { useSettingsStore } from '../store/useSettingsStore';

interface Props {
  isPlaying: boolean;
}

export function AudioController({ isPlaying }: Props) {
  const timeScale = useEngineStore((s) => s.timeScale);
  const isPanelOpen = useUIStore((s) => s.isPanelOpen);
  const isTutorialOpen = useUIStore((s) => s.isTutorialOpen);
  const isPauseMenuOpen = useUIStore((s) => s.isPauseMenuOpen);
  const isOnboardingOpen = useUIStore((s) => s.isOnboardingOpen);

  useEffect(() => {
    // 1. Determine ultimate pause state based on UI + play state
    const isPaused = isPanelOpen || isTutorialOpen || isPauseMenuOpen || isOnboardingOpen || !isPlaying || timeScale === 0;

    // 2. Map logical simulation speed to audio playback rate
    let targetRate = 1.0;
    if (isPaused) {
      targetRate = 1.0; // When paused, music continues at 1x speed
    } else {
      if (timeScale === 1) targetRate = 1.0;
      else if (timeScale === 2) targetRate = 1.5;
      else if (timeScale >= 10) targetRate = 2.0;
    }

    audio.setPlaybackRate(targetRate);

  }, [isPlaying, timeScale, isPanelOpen, isTutorialOpen, isPauseMenuOpen, isOnboardingOpen]);

  // Page Visibility API Edge Case
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Mute or pause music when tab is hidden to prevent annoying background sound
        audio.setVolumes(0, 0, 0); 
      } else {
        // Restore volumes.
        const settings = useSettingsStore.getState();
        audio.setVolumes(settings.masterVolume, settings.sfxVolume, settings.musicVolume);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null; // Invisible component
}
