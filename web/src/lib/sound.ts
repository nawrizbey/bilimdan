let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, type: OscillatorType = 'sine', peakGain = 0.15, delayMs = 0) {
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const startAt = audioCtx.currentTime + delayMs / 1000;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(startAt);
  osc.stop(startAt + durationMs / 1000 + 0.02);
}

/** Synthesized UI sound effects (no audio asset files in this project — mascot/logo
 * are likewise inline SVG, not images). Callers are responsible for checking the
 * user's "Ovoz effektlari" setting before invoking these. */
export function playMatchFound() {
  tone(660, 130);
  tone(990, 200, 'sine', 0.15, 110);
}

export function playCorrect() {
  tone(880, 140);
  tone(1175, 180, 'sine', 0.15, 90);
}

export function playIncorrect() {
  tone(190, 240, 'sawtooth', 0.1);
}

export function playTick() {
  tone(1300, 70, 'square', 0.05);
}
