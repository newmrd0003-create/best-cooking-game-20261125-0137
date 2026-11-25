// audio.js — every sound in Ember & Order is a synthesized WebAudio tone.
// No audio files, no network: short oscillator envelopes plus a filtered noise
// burst for chopping and sizzling. The AudioContext is created lazily on the
// first user gesture so browsers never block it.

let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// One tone: frequency slide from f0 to f1 over `dur` seconds.
export function tone(f0, f1, dur, type = 'sine', vol = 0.16, when = 0) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(30, f0), t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, freq) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(ac.destination);
  src.start();
}

export const sfx = {
  click() { tone(660, 520, 0.06, 'triangle', 0.10); },
  pickup() { tone(420, 640, 0.09, 'triangle', 0.12); },
  chop() { noiseBurst(0.09, 0.25, 1800); tone(180, 90, 0.07, 'square', 0.08); },
  sizzle() { noiseBurst(0.35, 0.10, 5200); },
  cooked() { tone(520, 780, 0.12, 'sine', 0.12); tone(780, 1040, 0.12, 'sine', 0.10, 0.10); },
  plate() { tone(880, 880, 0.07, 'triangle', 0.12); tone(1174, 1174, 0.09, 'triangle', 0.10, 0.07); },
  serve() { tone(523, 659, 0.10, 'triangle', 0.14); tone(659, 784, 0.10, 'triangle', 0.14, 0.09); tone(784, 1046, 0.16, 'triangle', 0.14, 0.18); },
  coin() { tone(988, 1319, 0.14, 'sine', 0.12); },
  fail() { tone(220, 110, 0.35, 'sawtooth', 0.12); },
  burn() { tone(300, 90, 0.4, 'sawtooth', 0.12); noiseBurst(0.25, 0.15, 900); },
  newOrder() { tone(392, 523, 0.12, 'triangle', 0.11); },
  dayUp() { tone(523, 523, 0.12, 'triangle', 0.13); tone(659, 659, 0.12, 'triangle', 0.13, 0.11); tone(784, 1046, 0.22, 'triangle', 0.13, 0.22); },
  gameOver() { tone(392, 370, 0.25, 'triangle', 0.13); tone(370, 330, 0.25, 'triangle', 0.13, 0.22); tone(330, 262, 0.45, 'triangle', 0.13, 0.44); },
};
