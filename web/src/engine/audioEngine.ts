import { worldRef } from './worldRef';
import { AUDIO_ASSETS } from '../constants/audioConfig';
import { useStore } from '../store/useStore';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;


  private lastUITickTime = 0;
  private lastUIPopTime = 0;

  // Hybrid Audio State
  private sfxBuffers: Record<string, AudioBuffer> = {};
  private dayBgm: HTMLAudioElement | null = null;
  private nightBgm: HTMLAudioElement | null = null;
  private isAssetLoading = false;
  private currentCrossfade = 0; // 0 = day, 1 = night

  // State
  private isBgmPlaying = false;
  private bgmTimeoutId: number | null = null;
  private currentPlaybackRate = 1.0;
  
  // Settings
  private volumes = {
    master: 0.4,
    sfx: 0.3,
    music: 0.25
  };

  // C Major Pentatonic (C4, D4, E4, G4, A4, C5, D5)
  private pentatonicScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33];

  private init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();

      this.sfxGain.connect(this.masterGain);
      this.bgmGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.updateVolumes();
      this.loadCustomAssets();

      // Subscribe to timeScale changes
      useStore.subscribe((state) => {
        this.setTimeScale(state.timeScale);
      });
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  private async loadCustomAssets() {
    if (this.isAssetLoading || !this.ctx) return;
    this.isAssetLoading = true;
    
    // Create HTML Audio synchronously so startBGM doesn't fall back to procedural!
    this.dayBgm = new Audio(AUDIO_ASSETS.bgm.dayTheme);
    this.dayBgm.loop = true;
    this.nightBgm = new Audio(AUDIO_ASSETS.bgm.nightTheme);
    this.nightBgm.loop = true;
    this.syncHtmlAudioVolumes();

    for (const [key, url] of Object.entries(AUDIO_ASSETS.sfx)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.sfxBuffers[key] = audioBuffer;
        }
      } catch (e) {} // Fallback to procedural
    }
  }

  private playCustomSfx(key: keyof typeof AUDIO_ASSETS.sfx, volumeMod: number = 1.0, playbackRate: number = 1.0): boolean {
    if (!this.ctx || !this.sfxGain || !this.sfxBuffers[key]) return false;
    const source = this.ctx.createBufferSource();
    source.buffer = this.sfxBuffers[key];
    source.playbackRate.value = playbackRate;
    const gain = this.ctx.createGain();
    gain.gain.value = volumeMod;
    source.connect(gain);
    gain.connect(this.sfxGain);
    source.start(this.ctx.currentTime);
    return true;
  }

  public setVolumes(master: number, sfx: number, music: number) {
    this.volumes = { master, sfx, music };
    this.updateVolumes();
  }

  private updateVolumes() {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.bgmGain) return;
    
    const now = this.ctx.currentTime;
    // Use linearRamp to prevent pops when changing volume
    this.masterGain.gain.setTargetAtTime(this.volumes.master, now, 0.1);
    this.sfxGain.gain.setTargetAtTime(this.volumes.sfx, now, 0.1);
    this.bgmGain.gain.setTargetAtTime(this.volumes.music * 0.5, now, 0.1); // BGM naturally quieter
    
    this.syncHtmlAudioVolumes();
  }

  public updateTimeOfDay(timeOfDay: number) {
    let factor = 0;
    if (timeOfDay >= 0.5 && timeOfDay < 0.6) {
      // Dusk: fade to night
      factor = (timeOfDay - 0.5) / 0.1;
    } else if (timeOfDay >= 0.6 && timeOfDay < 0.9) {
      // Deep night
      factor = 1;
    } else if (timeOfDay >= 0.9 && timeOfDay <= 1.0) {
      // Dawn: fade to day
      factor = 1.0 - ((timeOfDay - 0.9) / 0.1);
    }
    if (this.currentCrossfade !== factor) {
      this.currentCrossfade = factor;
      this.syncHtmlAudioVolumes();
    }
  }

  private syncHtmlAudioVolumes() {
    const masterVol = this.volumes.master * this.volumes.music * 0.5;
    if (this.dayBgm) this.dayBgm.volume = Math.max(0, Math.min(1, masterVol * (1 - this.currentCrossfade)));
    if (this.nightBgm) this.nightBgm.volume = Math.max(0, Math.min(1, masterVol * this.currentCrossfade));
  }

  public setTimeScale(scale: number) {
    const targetRate = scale === 1 ? 1.0 : (scale === 2 ? 1.5 : 2.0);
    if (this.currentPlaybackRate === targetRate) return;
    
    this.currentPlaybackRate = targetRate;
    if (this.dayBgm) this.dayBgm.playbackRate = this.currentPlaybackRate;
    if (this.nightBgm) this.nightBgm.playbackRate = this.currentPlaybackRate;
  }

  public playUITick() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = Date.now();
    if (now - this.lastUITickTime < 50) return; // throttle 50ms
    this.lastUITickTime = now;
    
    // Play subtle tick
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  public playUIPop() {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = Date.now();
    if (now - this.lastUIPopTime < 50) return; // throttle 50ms
    this.lastUIPopTime = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  public playPop() {
    this.init();
    if (this.playCustomSfx('godLure')) return;
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.8, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playZap() {
    this.init();
    if (this.playCustomSfx('godSmite')) return;
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playCrunch() {
    this.init();
    if (this.playCustomSfx('godFeed')) return;
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1500;
    
    const gain = this.ctx.createGain();
    
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05); 
    gain.gain.linearRampToValueAtTime(0.6, now + 0.06); 
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); 
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    noise.start(now);
  }

  public startBGM() {
    this.init();
    if (!this.ctx) return;
    
    // AudioContext might be suspended if startBGM is called before a user gesture
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isBgmPlaying = true;
    
    if (this.dayBgm && this.nightBgm) {
      this.syncHtmlAudioVolumes();
      
      if (this.dayBgm.paused) {
        this.dayBgm.play().then(() => {
          // If HTML audio successfully starts, forcibly kill any procedural timeouts just in case!
          if (this.bgmTimeoutId !== null) {
            clearTimeout(this.bgmTimeoutId);
            this.bgmTimeoutId = null;
          }
        }).catch(() => {
          // Do NOT fall back to procedural if HTML audio fails (e.g. autoplay block).
          // We will just retry on the next user interaction.
        });
      }
      
      if (this.nightBgm.paused) {
        this.nightBgm.play().catch(() => {});
      }
    } else {
      if (this.bgmTimeoutId === null) {
        this.playNextBgmNote();
      }
    }
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimeoutId !== null) {
      clearTimeout(this.bgmTimeoutId);
      this.bgmTimeoutId = null;
    }
    if (this.dayBgm) this.dayBgm.pause();
    if (this.nightBgm) this.nightBgm.pause();
  }

  private playNextBgmNote() {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    const freq = this.pentatonicScale[Math.floor(Math.random() * this.pentatonicScale.length)];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = freq;
    
    const now = this.ctx.currentTime;
    const attack = 1.0 / this.currentPlaybackRate;
    const release = 2.5 / this.currentPlaybackRate;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.01, now + attack + release);
    
    osc.connect(gain);
    gain.connect(this.bgmGain);
    
    osc.start(now);
    osc.stop(now + attack + release);
    
    const nextTime = (Math.random() * 1500 + 500) / this.currentPlaybackRate; // 500ms to 2000ms scaled
    this.bgmTimeoutId = window.setTimeout(() => this.playNextBgmNote(), nextTime);
  }

  public playSpawn() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    
    // Create a magical ascending chime
    const notes = [400, 500, 600, 800, 1200];
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      
      const startTime = now + (i * 0.05);
      osc.frequency.setValueAtTime(freq, startTime);
      
      // Fast attack, slow decay per note
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  private lastPlayedEvent: Record<string, number> = {};

  public playCreatureEvent(
    event: 'EAT' | 'HURT' | 'SLEEP' | 'ATTACK', 
    x: number,
    y: number,
    scale: number, 
    diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE'
  ) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;

    // --- Spatial Hard Cull ---
    // If the sound is too far away, we abort immediately before checking debounce.
    // This prevents off-screen creatures from silencing on-screen creatures (Debounce Masking Fix).
    const cam = worldRef.current?.camera;
    // We assume max view width is ~2000px at zoom 1. We cull at distance 1500 (squared = 2250000).
    // The culling distance scales with zoom: zoom in (zoom=2) means we cull closer (dist 750).
    const cullDist = 1500 / (cam?.zoom || 1);
    let distSq = 0;
    if (cam) {
      const dx = cam.x - x;
      const dy = cam.y - y;
      distSq = dx * dx + dy * dy;
      if (distSq > cullDist * cullDist) {
        return; // Too far away, completely silent! (Hard cull saves CPU and avoids masking)
      }
    }

    const now = this.ctx.currentTime;
    // Debounce to prevent audio spam
    const eventKey = `${event}_${diet}`;
    const debounceTimes = { EAT: 0.15, HURT: 0.1, SLEEP: 2.0, ATTACK: 0.5 };
    const delay = debounceTimes[event] || 0.2;
    
    if (this.lastPlayedEvent[eventKey] && now - this.lastPlayedEvent[eventKey] < delay) {
      return;
    }
    this.lastPlayedEvent[eventKey] = now;

    // --- Spatial Attenuation ---
    // Calculate precise distance for volume fading (only if it passed the hard cull).
    let distanceGain = 1.0;
    if (distSq > 0 && cullDist > 0) {
      const distance = Math.sqrt(distSq);
      distanceGain = Math.max(0.01, 1.0 - (distance / cullDist));
    }

    let customKey: keyof typeof AUDIO_ASSETS.sfx | null = null;
    if (event === 'EAT') customKey = 'creatureEat';
    else if (event === 'HURT') customKey = 'creatureHurt';
    else if (event === 'ATTACK') customKey = 'creatureAttack';
    else if (event === 'SLEEP') customKey = 'creatureSleep';
    
    if (customKey && this.playCustomSfx(customKey, distanceGain, 1.0 / scale)) {
      return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Size changes base frequency
    const baseFreq = event === 'HURT' ? 600 : event === 'ATTACK' ? 150 : event === 'SLEEP' ? 300 : 400;
    const freq = baseFreq / scale;

    // Diet changes waveform
    osc.type = diet === 'HERBIVORE' ? 'sine' : diet === 'CARNIVORE' ? 'sawtooth' : 'square';
    
    // Map event to envelope and sweep
    if (event === 'EAT') {
      // Replaced sharp oscillator with a natural soft crunch
      const bufferSize = this.ctx.sampleRate * 0.15;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = diet === 'HERBIVORE' ? 800 : 1200;
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 * distanceGain, now + 0.02);
      gain.gain.linearRampToValueAtTime(0.1 * distanceGain, now + 0.05);
      gain.gain.linearRampToValueAtTime(0.3 * distanceGain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      noise.start(now);
    } 
    else if (event === 'HURT') {
      osc.frequency.setValueAtTime(freq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 * distanceGain, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      
      // Soften the hurt beep so it doesn't sound like a harsh arcade error
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200; 
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.1);
    } 
    else if (event === 'ATTACK') {
      osc.frequency.setValueAtTime(freq * 0.8, now);
      osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.6 * distanceGain, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      
      // Low pass filter to make it a deep growl instead of harsh buzz
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(now);
      osc.stop(now + 0.2);
    } 
    else if (event === 'SLEEP') {
      osc.type = 'sine'; // Always sine for sleeping to stay soft
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.5);
      osc.frequency.linearRampToValueAtTime(freq, now + 1.0);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2 * distanceGain, now + 0.5);
      gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.0);
    }
  }

  // --- UI and God Tool Hooks ---

  public playUIClick() {
    this.init();
    // Subagent fix: Explicitly resume AudioContext upon first UI interaction!
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isBgmPlaying && this.dayBgm && this.dayBgm.paused) {
      this.dayBgm.play().then(() => {
        if (this.bgmTimeoutId !== null) {
          clearTimeout(this.bgmTimeoutId);
          this.bgmTimeoutId = null;
        }
      }).catch(() => {});
      this.nightBgm?.play().catch(() => {});
    }

    if (this.playCustomSfx('uiClick')) return;
    
    if (!this.ctx || !this.sfxGain) return;
    
    const now = this.ctx.currentTime;
    // Only play if not played in last 0.05s to prevent massive spam on rapid clicks
    if (this.lastPlayedEvent['UIClick'] && now - this.lastPlayedEvent['UIClick'] < 0.05) return;
    this.lastPlayedEvent['UIClick'] = now;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private playHeal() {
    this.init();
    if (this.playCustomSfx('godHeal')) return;
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const now = this.ctx.currentTime;
    
    // Magical rising arpeggio / chime effect
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(now);
    osc.stop(now + 0.5);
  }

  public playLevelUp(x: number, y: number) {
    this.init();

    const cam = worldRef.current?.camera;
    const cullDist = 1500 / (cam?.zoom || 1);
    let distanceGain = 1.0;
    
    if (cam) {
      const distSq = (cam.x - x)**2 + (cam.y - y)**2;
      if (distSq > cullDist * cullDist) return; // Hard cull
      distanceGain = Math.max(0.01, 1.0 - (Math.sqrt(distSq) / cullDist));
    }
    
    if (this.playCustomSfx('levelUp', distanceGain)) return;

    const ctx = this.ctx;
    const sfxGain = this.sfxGain;
    if (!ctx || !sfxGain) return;

    if (cam) {
      const now = ctx.currentTime;
      // Arpeggio: C5 -> E5 -> G5
      const notes = [523.25, 659.25, 783.99];
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        
        const startTime = now + (i * 0.1);
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.4 * distanceGain, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        
        osc.connect(gain);
        gain.connect(sfxGain);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    }
  }

  public playGodTool(type: 'POINTER' | 'SMITE' | 'HEAL' | 'FEED' | 'LURE' | 'GRAB') {
    if (type === 'SMITE') this.playZap();
    else if (type === 'FEED') this.playCrunch();
    else if (type === 'LURE') this.playPop();
    else if (type === 'HEAL') this.playHeal();
    else this.playUIClick();
  }
}

export const audio = new AudioEngine();
