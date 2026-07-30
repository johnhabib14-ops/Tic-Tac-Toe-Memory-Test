/**
 * Optional accessibility-friendly practice cues.
 * No audio plays when soundOff is true (default). Sound is never required.
 */
export function playPracticeCue(
  kind: 'correct' | 'incorrect',
  soundOff: boolean
): void {
  if (soundOff || typeof window === 'undefined') return;
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = kind === 'correct' ? 660 : 220;
    gain.gain.value = 0.04;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.stop(ctx.currentTime + 0.13);
    window.setTimeout(() => void ctx.close(), 200);
  } catch {
    // Ignore audio failures — task remains fully usable without sound.
  }
}
