// Bible Jeopardy's sounds (the audit's item 2): short generated tones in the manner of Family charades' sound.ts, no
// audio files. One AudioContext, made or woken inside a tap or key press (iPhones only let sound begin from one), and
// never the only signal: every chime has a flash, a count or a stamp on screen beside it. The host's on/off choice is
// remembered under its own key, apart from the settings, so a game saved before this existed still loads.

export type Cue = "chime" | "buzz" | "sting" | "time" | "drum" | "tick";

interface Note { frequency: number; seconds: number; type: OscillatorType; at: number; gain?: number }

/** Each cue as one or more notes, offsets in seconds from the cue's start. */
const CUES: Record<Cue, Note[]> = {
  chime: [{ frequency: 880, seconds: 0.18, type: "sine", at: 0 }, { frequency: 1320, seconds: 0.3, type: "sine", at: 0.09 }],
  buzz: [{ frequency: 150, seconds: 0.45, type: "sawtooth", at: 0, gain: 0.08 }],
  sting: [{ frequency: 523, seconds: 0.15, type: "triangle", at: 0 }, { frequency: 659, seconds: 0.15, type: "triangle", at: 0.12 }, { frequency: 784, seconds: 0.5, type: "triangle", at: 0.24 }],
  time: [{ frequency: 220, seconds: 0.35, type: "square", at: 0, gain: 0.06 }, { frequency: 165, seconds: 0.6, type: "square", at: 0.3, gain: 0.06 }],
  drum: [0, 0.12, 0.24, 0.36, 0.48].map((at) => ({ frequency: 110, seconds: 0.1, type: "triangle" as OscillatorType, at, gain: 0.12 })),
  tick: [{ frequency: 1500, seconds: 0.04, type: "square", at: 0, gain: 0.05 }],
};

export const SOUNDS_KEY = "bp-jeopardy-sounds";

let context: AudioContext | null = null;

/** Called synchronously inside a tap or key press: makes (or wakes) the one AudioContext. Never throws. */
export function unlockSound(): void {
  try {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    context ??= new AudioContextClass();
    if (context.state === "suspended") void context.resume().catch((error: unknown) => console.warn("Bible Jeopardy: sound could not start", error));
  } catch (error) {
    console.warn("Bible Jeopardy: sound is not available here", error);
    context = null;
  }
}

/** Plays one cue, when sound is unlocked; silent otherwise. */
export function play(cue: Cue): void {
  if (!context || context.state === "closed") return;
  try {
    const start = context.currentTime;
    for (const note of CUES[cue]) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = note.type;
      tone.frequency.value = note.frequency;
      gain.gain.setValueAtTime(note.gain ?? 0.12, start + note.at);
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.at + note.seconds);
      tone.connect(gain).connect(context.destination);
      tone.start(start + note.at);
      tone.stop(start + note.at + note.seconds);
    }
  } catch (error) {
    console.warn("Bible Jeopardy: a sound could not play", error);
  }
}

/** The host's choice: on unless this browser turned sounds off. */
export function loadSoundsOn(store: Storage | null): boolean {
  try {
    return store?.getItem(SOUNDS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function saveSoundsOn(store: Storage | null, on: boolean): void {
  try {
    if (on) store?.removeItem(SOUNDS_KEY);
    else store?.setItem(SOUNDS_KEY, "off");
  } catch (error) {
    console.warn("Bible Jeopardy: the sound setting could not be saved", error);
  }
}
