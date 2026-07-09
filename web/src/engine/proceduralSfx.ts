export function generatePop(ctx: AudioContext, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.8, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
  
  osc.connect(gain);
  gain.connect(dest);
  
  osc.start(now);
  osc.stop(now + 0.1);
}

export function generateZap(ctx: AudioContext, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  
  const now = ctx.currentTime;
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc.connect(gain);
  gain.connect(dest);
  
  osc.start(now);
  osc.stop(now + 0.15);
}

export function generateCrunch(ctx: AudioContext, dest: AudioNode) {
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1500;
  
  const gain = ctx.createGain();
  
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.7, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.1, now + 0.05); 
  gain.gain.linearRampToValueAtTime(0.6, now + 0.06); 
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); 
  
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  
  noise.start(now);
}

export function generateSpawnChime(ctx: AudioContext, dest: AudioNode) {
  const now = ctx.currentTime;
  const notes = [400, 500, 600, 800, 1200];
  
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    
    const startTime = now + (i * 0.05);
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
    
    osc.connect(gain);
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

export function generateHealChime(ctx: AudioContext, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const now = ctx.currentTime;
  
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
  
  osc.connect(gain);
  gain.connect(dest);
  
  osc.start(now);
  osc.stop(now + 0.5);
}

export function generateCreatureEvent(
  ctx: AudioContext,
  dest: AudioNode,
  event: 'EAT' | 'HURT' | 'SLEEP' | 'ATTACK',
  scale: number,
  diet: 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE',
  distanceGain: number
) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  const baseFreq = event === 'HURT' ? 600 : event === 'ATTACK' ? 150 : event === 'SLEEP' ? 300 : 400;
  const freq = baseFreq / scale;

  osc.type = diet === 'HERBIVORE' ? 'sine' : diet === 'CARNIVORE' ? 'sawtooth' : 'square';
  
  if (event === 'EAT') {
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = diet === 'HERBIVORE' ? 800 : 1200;
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4 * distanceGain, now + 0.02);
    gain.gain.linearRampToValueAtTime(0.1 * distanceGain, now + 0.05);
    gain.gain.linearRampToValueAtTime(0.3 * distanceGain, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    noise.start(now);
  } 
  else if (event === 'HURT') {
    osc.frequency.setValueAtTime(freq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.1);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4 * distanceGain, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200; 
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.1);
  } 
  else if (event === 'ATTACK') {
    osc.frequency.setValueAtTime(freq * 0.8, now);
    osc.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.15);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.6 * distanceGain, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    
    osc.start(now);
    osc.stop(now + 0.2);
  } 
  else if (event === 'SLEEP') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.linearRampToValueAtTime(freq * 0.8, now + 0.5);
    osc.frequency.linearRampToValueAtTime(freq, now + 1.0);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.2 * distanceGain, now + 0.5);
    gain.gain.linearRampToValueAtTime(0.01, now + 1.0);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 1.0);
  }
}

export function generateLevelUpChime(ctx: AudioContext, dest: AudioNode, distanceGain: number) {
  const now = ctx.currentTime;
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
    gain.connect(dest);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  });
}
