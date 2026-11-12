// The leader's sounds (audit items 2 and 4): short generated tones, no audio files, in the manner of the charades
// game's sound.ts. One AudioContext, made or woken inside the Sound button's tap, because phones and some laptops only
// let sound begin from a tap. Sound is never the only signal: every tone decorates something already on the screen.

export type Tone = "open" | "reveal" | "tick" | "join";

const TONES: Record<Tone, { frequency: number; seconds: number; type: OscillatorType; gain: number }> = {
  open: { frequency: 587, seconds: 0.5, type: "sine", gain: 0.15 },
  reveal: { frequency: 880, seconds: 0.5, type: "sine", gain: 0.15 },
  tick: { frequency: 1100, seconds: 0.05, type: "square", gain: 0.05 },
  join: { frequency: 740, seconds: 0.18, type: "triangle", gain: 0.1 },
};

let context: AudioContext | null = null;

/** Called synchronously in the Sound tap: makes (or wakes) the one AudioContext. Never throws. */
export function unlockSound(): void {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    context ??= new AudioContextClass();
    if (context.state === "suspended") void context.resume().catch((error: unknown) => console.warn("live-quiz: sound could not start", error));
  } catch (error) {
    console.warn("live-quiz: sound is not available here", error);
    context = null;
  }
}

export function play(kind: Tone): void {
  if (!context || context.state === "closed") return;
  try {
    const { frequency, seconds, type, gain: level } = TONES[kind];
    const tone = context.createOscillator();
    const gain = context.createGain();
    tone.type = type;
    tone.frequency.value = frequency;
    gain.gain.setValueAtTime(level, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + seconds);
    tone.connect(gain).connect(context.destination);
    tone.start();
    tone.stop(context.currentTime + seconds);
  } catch (error) {
    console.warn("live-quiz: a tone could not play", error);
  }
}
