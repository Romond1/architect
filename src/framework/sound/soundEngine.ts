export type StudioSoundEffect =
  | 'chime'
  | 'coin'
  | 'submit'
  | 'revision'
  | 'celebrate'
  | 'grandFinale';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const Win = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = Win.AudioContext ?? Win.webkitAudioContext;
  if (!Ctor) {
    return null;
  }
  try {
    return new Ctor();
  } catch {
    return null;
  }
}

let sharedCtx: AudioContext | null = null;

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffsetSec: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.08
): void {
  const start = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + durationSec + 0.03);
}

export function playStudioSound(
  effect: StudioSoundEffect,
  enabled: boolean
): void {
  if (!enabled) {
    return;
  }
  if (!sharedCtx) {
    sharedCtx = getAudioContext();
  }
  const ctx = sharedCtx;
  if (!ctx) {
    return;
  }
  try {
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }
    switch (effect) {
      case 'chime':
        playTone(ctx, 523.25, 0, 0.14, 'triangle', 0.06);
        playTone(ctx, 659.25, 0.08, 0.18, 'triangle', 0.06);
        break;
      case 'coin':
        playTone(ctx, 987.77, 0, 0.09, 'sine', 0.07);
        playTone(ctx, 1318.51, 0.07, 0.22, 'sine', 0.07);
        break;
      case 'submit':
        playTone(ctx, 440, 0, 0.12, 'triangle', 0.06);
        playTone(ctx, 554.37, 0.09, 0.14, 'triangle', 0.06);
        playTone(ctx, 659.25, 0.18, 0.22, 'triangle', 0.06);
        break;
      case 'revision':
        playTone(ctx, 440, 0, 0.14, 'sine', 0.05);
        playTone(ctx, 392, 0.12, 0.2, 'sine', 0.05);
        break;
      case 'celebrate':
        playTone(ctx, 523.25, 0, 0.15, 'triangle', 0.07);
        playTone(ctx, 659.25, 0.1, 0.15, 'triangle', 0.07);
        playTone(ctx, 783.99, 0.2, 0.18, 'triangle', 0.07);
        playTone(ctx, 1046.5, 0.32, 0.38, 'triangle', 0.08);
        break;
      case 'grandFinale':
        playTone(ctx, 523.25, 0, 0.16, 'triangle', 0.07);
        playTone(ctx, 659.25, 0.1, 0.16, 'triangle', 0.07);
        playTone(ctx, 783.99, 0.2, 0.16, 'triangle', 0.07);
        playTone(ctx, 1046.5, 0.32, 0.24, 'triangle', 0.08);
        playTone(ctx, 1318.51, 0.48, 0.24, 'triangle', 0.08);
        playTone(ctx, 1567.98, 0.64, 0.55, 'triangle', 0.09);
        break;
    }
  } catch {
    // Ignore audio errors gracefully
  }
}
