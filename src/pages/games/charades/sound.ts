// Family charades: generated beeps, no audio files (design §2.4, §7.3), in the manner of the live quiz's chime. One
// AudioContext, created or resumed inside the Start tap, because iPhones only let sound begin from a tap (§5.4).
// Sound is never the only signal.

type Beep = "correct" | "pass" | "tick" | "buzzer";

const TONES: Record<Beep, { frequency: number; seconds: number; type: OscillatorType }> = {
  correct: { frequency: 880, seconds: 0.25, type: "sine" },
  pass: { frequency: 392, seconds: 0.25, type: "triangle" },
  tick: { frequency: 1200, seconds: 0.06, type: "square" },
  buzzer: { frequency: 160, seconds: 0.9, type: "sawtooth" },
};

let context: AudioContext | null = null;

/** Called synchronously in the Start tap: makes (or wakes) the one AudioContext. Never throws. */
export function unlockSound(): void {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    context ??= new AudioContextClass();
    if (context.state === "suspended") void context.resume().catch((error: unknown) => console.warn("charades: sound could not start", error));
  } catch (error) {
    console.warn("charades: sound is not available here", error);
    context = null;
  }
}

export function beep(kind: Beep): void {
  if (!context || context.state === "closed") return;
  try {
    const { frequency, seconds, type } = TONES[kind];
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.type = type;
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + seconds);
    tone.connect(gain).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + seconds);
  } catch (error) {
    console.warn("charades: a beep could not play", error);
  }
}

/** A short buzz where the phone supports it, never when the reader asks for reduced motion (the live quiz's rule). */
export function buzz(ms = 40): void {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try { navigator.vibrate?.(ms); } catch { /* not supported: the screen already shows the answer */ }
}
