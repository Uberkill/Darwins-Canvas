import { worldRef } from './worldRef';
import { AUDIO_ASSETS } from '../constants/audioConfig';
import { calculateSpatialGain } from './spatialAudioUtils';
import { 
  generatePop, 
  generateZap, 
  generateCrunch, 
  generateSpawnChime, 
  generateHealChime, 
  generateCreatureEvent, 
  generateLevelUpChime 
} from './proceduralSfx';

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;


  private lastUITickTime = 0;
  private lastUIPopTime = 0;

  // Hybrid Audio State
  private sfxBuffers: Record<string, AudioBuffer> = {};
  
  // DJ Crossfader State
  private deckA: HTMLAudioElement | null = null;
  private deckB: HTMLAudioElement | null = null;
  private fadeGainA: GainNode | null = null;
  private fadeGainB: GainNode | null = null;
  private activeDeck: 'A' | 'B' = 'A';
  private currentTrackSrc: string | null = null;
  private isTransitioning = false;

  private isAssetLoading = false;

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
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  }

  private async loadCustomAssets() {
    if (this.isAssetLoading || !this.ctx) return;
    this.isAssetLoading = true;
    
    // Create HTML Audio synchronously so startBGM doesn't fall back to procedural!
    this.deckA = new Audio();
    this.deckA.loop = true;
    this.deckA.crossOrigin = 'anonymous'; // Important for MediaElementSource
    
    this.deckB = new Audio();
    this.deckB.loop = true;
    this.deckB.crossOrigin = 'anonymous';

    this.fadeGainA = this.ctx.createGain();
    this.fadeGainB = this.ctx.createGain();
    this.fadeGainA.gain.value = 1.0;
    this.fadeGainB.gain.value = 0.0;
    
    if (this.bgmGain) {
      this.fadeGainA.connect(this.bgmGain);
      this.fadeGainB.connect(this.bgmGain);
    }
    
    // Route elements to the graph exactly once to prevent InvalidStateError
    const sourceA = this.ctx.createMediaElementSource(this.deckA);
    const sourceB = this.ctx.createMediaElementSource(this.deckB);
    sourceA.connect(this.fadeGainA);
    sourceB.connect(this.fadeGainB);

    for (const [key, url] of Object.entries(AUDIO_ASSETS.sfx)) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
          this.sfxBuffers[key] = audioBuffer;
        }
      } catch {
        // Fallback to procedural
      }
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
  }

  public updateTimeOfDay(timeOfDay: number, _weather: string = 'CLEAR') {
    if (!this.ctx || !this.deckA || !this.deckB || !this.fadeGainA || !this.fadeGainB) return;
    
    // Determine Target Track based on state
    // In the future, this can easily support rainTheme, bossTheme, etc.
    let targetSrc = AUDIO_ASSETS.bgm.dayTheme;
    if (timeOfDay >= 0.5 && timeOfDay < 0.9) {
      targetSrc = AUDIO_ASSETS.bgm.nightTheme;
    }

    if (this.currentTrackSrc === targetSrc || this.isTransitioning || !this.isBgmPlaying) return;
    
    this.crossfadeTo(targetSrc);
  }

  private crossfadeTo(targetSrc: string) {
    if (!this.ctx || !this.deckA || !this.deckB || !this.fadeGainA || !this.fadeGainB) return;
    
    this.isTransitioning = true;
    this.currentTrackSrc = targetSrc;
    
    const now = this.ctx.currentTime;
    const fadeDuration = 3.0; // 3 seconds equal-power crossfade
    
    const isPlayingA = this.activeDeck === 'A';
    const activeDeck = isPlayingA ? this.deckA : this.deckB;
    const idleDeck = isPlayingA ? this.deckB : this.deckA;
    const activeGain = isPlayingA ? this.fadeGainA : this.fadeGainB;
    const idleGain = isPlayingA ? this.fadeGainB : this.fadeGainA;
    
    // Load new track into idle deck
    idleDeck.src = targetSrc;
    idleDeck.playbackRate = this.currentPlaybackRate;
    
    idleDeck.play().then(() => {
      // Ensure starting volumes are clean
      activeGain.gain.setValueAtTime(1.0, now);
      idleGain.gain.setValueAtTime(0.0, now);
      
      // Equal power crossfade uses cosine/sine curve for smooth perceptual volume
      // We simulate it closely enough with linear/exponential combinations, or just a straight linearRamp for web audio nodes since they handle logarithmic decibels natively if we use exponentialRamp
      // Actually, linearRampToValueAtTime on GainNode feels very natural for crossfading when opposite ramps are used
      activeGain.gain.linearRampToValueAtTime(0.0, now + fadeDuration);
      idleGain.gain.linearRampToValueAtTime(1.0, now + fadeDuration);
      
      this.activeDeck = isPlayingA ? 'B' : 'A';
      
      // Cleanup after fade
      setTimeout(() => {
        activeDeck.pause();
        this.isTransitioning = false;
      }, fadeDuration * 1000);
      
    }).catch((err) => {
      console.warn("Crossfade playback blocked:", err);
      this.isTransitioning = false;
    });
  }

  public setPlaybackRate(rate: number) {
    if (this.currentPlaybackRate === rate) return;
    
    this.currentPlaybackRate = rate;
    if (this.deckA) this.deckA.playbackRate = this.currentPlaybackRate;
    if (this.deckB) this.deckB.playbackRate = this.currentPlaybackRate;
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
    generatePop(this.ctx, this.sfxGain);
  }

  public playZap() {
    this.init();
    if (this.playCustomSfx('godSmite')) return;
    if (!this.ctx || !this.sfxGain) return;
    generateZap(this.ctx, this.sfxGain);
  }

  public playCrunch() {
    this.init();
    if (this.playCustomSfx('godFeed')) return;
    if (!this.ctx || !this.sfxGain) return;
    generateCrunch(this.ctx, this.sfxGain);
  }

  public startBGM() {
    this.init();
    if (!this.ctx) return;
    
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isBgmPlaying = true;
    
    if (this.deckA && this.deckB) {
      const activeDeck = this.activeDeck === 'A' ? this.deckA : this.deckB;
      
      // If we haven't assigned a track yet, set the default day theme
      if (!this.currentTrackSrc) {
        this.currentTrackSrc = AUDIO_ASSETS.bgm.dayTheme;
        activeDeck.src = this.currentTrackSrc;
      }
      
      if (activeDeck.paused) {
        activeDeck.play().then(() => {
          if (this.bgmTimeoutId !== null) {
            clearTimeout(this.bgmTimeoutId);
            this.bgmTimeoutId = null;
          }
        }).catch(() => {
          // Blocked by autoplay policy
        });
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
    if (this.deckA) this.deckA.pause();
    if (this.deckB) this.deckB.pause();
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
    if (this.playCustomSfx('godClone')) return;
    if (!this.ctx || !this.sfxGain) return;
    generateSpawnChime(this.ctx, this.sfxGain);
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
    const cam = worldRef.current?.camera;
    if (cam) {
      const { distanceGain, isCulled } = calculateSpatialGain(x, y, cam.x, cam.y, cam.zoom);
      if (isCulled) return;

      const now = this.ctx.currentTime;
      const eventKey = `${event}_${diet}`;
      const debounceTimes = { EAT: 0.15, HURT: 0.1, SLEEP: 2.0, ATTACK: 0.5 };
      const delay = debounceTimes[event] || 0.2;
      
      if (this.lastPlayedEvent[eventKey] && now - this.lastPlayedEvent[eventKey] < delay) {
        return;
      }
      this.lastPlayedEvent[eventKey] = now;

      let customKey: keyof typeof AUDIO_ASSETS.sfx | null = null;
      if (event === 'EAT') customKey = 'creatureEat';
      else if (event === 'HURT') customKey = 'creatureHurt';
      else if (event === 'ATTACK') customKey = 'creatureAttack';
      else if (event === 'SLEEP') customKey = 'creatureSleep';
      
      if (customKey && this.playCustomSfx(customKey, distanceGain, 1.0 / scale)) {
        return;
      }

      generateCreatureEvent(this.ctx, this.sfxGain, event, scale, diet, distanceGain);
    }
  }

  // --- UI and God Tool Hooks ---

  public playUIClick() {
    this.init();
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
    
    if (this.isBgmPlaying && this.deckA && this.deckB) {
      const activeDeck = this.activeDeck === 'A' ? this.deckA : this.deckB;
      if (activeDeck.paused) {
        if (!activeDeck.src && this.currentTrackSrc) {
          activeDeck.src = this.currentTrackSrc;
        }
        activeDeck.play().then(() => {
          if (this.bgmTimeoutId !== null) {
            clearTimeout(this.bgmTimeoutId);
            this.bgmTimeoutId = null;
          }
        }).catch(() => {});
      }
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
    generateHealChime(this.ctx, this.sfxGain);
  }

  public playLevelUp(x: number, y: number) {
    this.init();

    const cam = worldRef.current?.camera;
    if (cam) {
      const { distanceGain, isCulled } = calculateSpatialGain(x, y, cam.x, cam.y, cam.zoom);
      if (isCulled) return;
      
      if (this.playCustomSfx('levelUp', distanceGain)) return;

      const ctx = this.ctx;
      const sfxGain = this.sfxGain;
      if (!ctx || !sfxGain) return;

      generateLevelUpChime(ctx, sfxGain, distanceGain);
    }
  }

  public playGodTool(type: 'POINTER' | 'SMITE' | 'HEAL' | 'FEED' | 'LURE' | 'GRAB' | 'CLONE') {
    if (type === 'SMITE') this.playZap();
    else if (type === 'FEED') this.playCrunch();
    else if (type === 'LURE') this.playPop();
    else if (type === 'HEAL') this.playHeal();
    else if (type === 'CLONE') this.playSpawn();
    else this.playUIClick();
  }
}

export const audio = new AudioEngine();
