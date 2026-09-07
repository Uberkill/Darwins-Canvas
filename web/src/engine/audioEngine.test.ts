import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audio } from './audioEngine';

// Mock dependencies
vi.mock('../constants/audioConfig', () => ({
  AUDIO_ASSETS: {
    sfx: { testSfx: 'test.mp3' },
    bgm: { dayTheme: 'day.mp3', nightTheme: 'night.mp3' }
  }
}));

vi.mock('./worldRef', () => ({
  worldRef: {
    current: {
      camera: { x: 0, y: 0, zoom: 1 }
    }
  }
}));

// Provide globals using vi.stubGlobal
const mockGain = {
  connect: vi.fn(),
  gain: {
    value: 1,
    setValueAtTime: vi.fn(),
    setTargetAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  }
};

const mockOscillator = {
  type: 'sine',
  frequency: {
    value: 440,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  },
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  sampleRate = 44100;
  destination = {};
  createGain = vi.fn(() => mockGain);
  createOscillator = vi.fn(() => mockOscillator);
  createBufferSource = vi.fn(() => ({
    buffer: null,
    playbackRate: { value: 1 },
    connect: vi.fn(),
    start: vi.fn(),
  }));
  createBuffer = vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(44100))
  }));
  createBiquadFilter = vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 1000 },
    connect: vi.fn(),
  }));
  createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }));
  resume = vi.fn().mockResolvedValue(undefined);
  decodeAudioData = vi.fn().mockResolvedValue({});
}

class MockAudio {
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  loop = false;
  src = '';
  playbackRate = 1;
  crossOrigin = '';
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('webkitAudioContext', MockAudioContext);
vi.stubGlobal('Audio', MockAudio);

describe('audioEngine', () => {
  beforeEach(() => {
    // Reset private fields
    (audio as any).ctx = null;
    (audio as any).masterGain = null;
    (audio as any).sfxGain = null;
    (audio as any).bgmGain = null;
    (audio as any).isBgmPlaying = false;
    (audio as any).deckA = null;
    (audio as any).deckB = null;
    
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes context and handles volumes', () => {
    // Forces init
    audio.startBGM();
    expect((audio as any).ctx).toBeInstanceOf(MockAudioContext);
    
    // Test volumes
    audio.setVolumes(0.5, 0.4, 0.3);
    // Because it creates new MockAudioContext, we check its createGain
    expect((audio as any).masterGain.gain.setTargetAtTime).toHaveBeenCalledWith(0.5, 0, 0.1);
  });

  it('start and stop BGM', () => {
    audio.startBGM();
    expect((audio as any).isBgmPlaying).toBe(true);
    
    audio.stopBGM();
    expect((audio as any).isBgmPlaying).toBe(false);
  });
  
  it('updates time of day and crossfades', () => {
    (audio as any).deckA = new MockAudio();
    (audio as any).deckB = new MockAudio();
    (audio as any).fadeGainA = mockGain;
    (audio as any).fadeGainB = mockGain;
    
    audio.startBGM();
    audio.updateTimeOfDay(0.6); // Night theme
    expect((audio as any).currentTrackSrc).toBe('night.mp3');
  });

  it('sets playback rate', () => {
    (audio as any).deckA = new MockAudio();
    (audio as any).deckB = new MockAudio();
    audio.startBGM();
    audio.setPlaybackRate(1.5);
    expect((audio as any).currentPlaybackRate).toBe(1.5);
    expect((audio as any).deckA.playbackRate).toBe(1.5);
  });

  it('throttles UI clicks', () => {
    audio.playUIClick();
    const mockCtx = (audio as any).ctx;
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    const calls = mockCtx.createOscillator.mock.calls.length;
    
    audio.playUIClick(); // within 50ms (currentTime is 0)
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(calls);
    
    mockCtx.currentTime = 1; // move time
    audio.playUIClick();
    expect(mockCtx.createOscillator).toHaveBeenCalledTimes(calls + 1);
  });

  it('god tools map correctly', () => {
    audio.playGodTool('SMITE');
    audio.playGodTool('FEED');
    audio.playGodTool('LURE');
    audio.playGodTool('HEAL');
    audio.playGodTool('CLONE');
    audio.playGodTool('POINTER');
    
    expect((audio as any).ctx).toBeInstanceOf(MockAudioContext);
  });

  it('creature events map correctly with spatial culling', () => {
    // With current worldRef mock, camera zoom is 1, pos is 0,0
    audio.playCreatureEvent('EAT', 0, 0, 1, 'HERBIVORE');
    audio.playCreatureEvent('HURT', 0, 0, 1, 'CARNIVORE');
    audio.playCreatureEvent('SLEEP', 0, 0, 1, 'OMNIVORE');
    audio.playCreatureEvent('ATTACK', 0, 0, 1, 'CARNIVORE');
    
    expect((audio as any).ctx).toBeInstanceOf(MockAudioContext);
  });
  
  it('level up sound maps correctly', () => {
    audio.playLevelUp(0, 0);
    expect((audio as any).ctx).toBeInstanceOf(MockAudioContext);
  });
});
