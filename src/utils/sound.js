const MUTE_KEY = 'dailypin-muted';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isMuted() {
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function toggleMute() {
  const muted = isMuted();
  if (muted) {
    localStorage.removeItem(MUTE_KEY);
  } else {
    localStorage.setItem(MUTE_KEY, '1');
  }
  return !muted;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // silent fail — audio not supported
  }
}

// Pin placed on map — short percussive thud
export function playPinDrop() {
  if (isMuted()) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // silent fail
  }
}

// Reveal chime — pitch varies by quality: 'green' | 'yellow' | 'orange' | 'red'
export function playReveal(quality) {
  const freqMap = { green: 880, yellow: 660, orange: 440, red: 330 };
  const freq = freqMap[quality] || 440;
  playTone(freq, 0.3, 'triangle', 0.12);
  if (quality === 'green') {
    // Extra sparkle for green
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.08), 100);
  }
}

// Game complete — ascending arpeggio
export function playComplete() {
  if (isMuted()) return;
  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.1), i * 120);
  });
}

// Tick sound for count-up animation
export function playTick() {
  playTone(1000, 0.05, 'square', 0.04);
}
