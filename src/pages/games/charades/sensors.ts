// Family charades: the phone's sensors and the screen (design §5.4). Everything that needs the Start tap is started in
// `startTap`, synchronously, before anything is awaited: once code has waited on a promise, iPhones may no longer
// count what follows as part of the tap, and then sound stays locked or fullscreen is refused.
import { useEffect, useRef } from "react";
import { unlockSound } from "./sound";
import type { Reading } from "./tilt";

export const READING_WAIT_MS = 1000;
export const READINGS_STOPPED_MS = 3000;

type PermissionResult = "granted" | "denied" | "not-needed";
type OrientationWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
type LockableOrientation = ScreenOrientation & { lock?: (orientation: string) => Promise<void> };

/** Whether this browser knows orientation events at all; most desktop browsers do even with no sensor. */
export const tiltKnown = () => typeof window !== "undefined" && typeof window.DeviceOrientationEvent !== "undefined";

const isTouch = () => !!window.matchMedia?.("(pointer: coarse)").matches;
const orientation = () => (typeof screen !== "undefined" ? (screen.orientation as LockableOrientation | undefined) : undefined);

let wakeLock: WakeLockSentinel | null = null;

/** Asks to keep the screen awake; a refusal only means the phone may dim. */
export function requestWakeLock(): Promise<void> {
  if (!("wakeLock" in navigator)) return Promise.resolve();
  try {
    return navigator.wakeLock.request("screen").then((lock) => { wakeLock = lock; },
      (error: unknown) => console.warn("charades: the screen could not be kept awake", error));
  } catch (error) {
    console.warn("charades: the screen could not be kept awake", error);
    return Promise.resolve();
  }
}

export function releaseWakeLock(): void {
  void wakeLock?.release().catch((error: unknown) => console.warn("charades: the wake lock did not release", error));
  wakeLock = null;
}

function requestFullscreen(): Promise<boolean> {
  const element = document.documentElement;
  if (!element.requestFullscreen) return Promise.resolve(false);
  try {
    return element.requestFullscreen().then(() => true, () => false);
  } catch {
    return Promise.resolve(false); // refused: the round plays in the page as it is
  }
}

export function leaveFullscreen(): void {
  if (!document.fullscreenElement || !document.exitFullscreen) return;
  document.exitFullscreen().catch((error: unknown) => console.warn("charades: could not leave fullscreen", error));
}

function requestPermission(): Promise<PermissionResult> {
  const request = (window.DeviceOrientationEvent as OrientationWithPermission | undefined)?.requestPermission;
  if (typeof request !== "function") return Promise.resolve("not-needed");
  try {
    return request.call(window.DeviceOrientationEvent).then((answer) => (answer === "granted" ? "granted" : "denied"), () => "denied");
  } catch {
    return Promise.resolve("denied"); // a browser that throws instead of asking: treated as a refusal
  }
}

export interface TapStarted { permission: Promise<PermissionResult> | null; fullscreen: Promise<boolean>; wakeLock: Promise<void> }

/**
 * Called synchronously in the Start tap handler, before it awaits anything: sound, wake lock, fullscreen (only in
 * Guess it, on a touch device that can lock its orientation, in practice Android) and the iOS motion prompt.
 */
export function startTap({ sound, wantTilt, guessMode }: { sound: boolean; wantTilt: boolean; guessMode: boolean }): TapStarted {
  if (sound) unlockSound();
  const wake = requestWakeLock();
  const wantFullscreen = guessMode && isTouch() && typeof orientation()?.lock === "function";
  const fullscreen = wantFullscreen ? requestFullscreen() : Promise.resolve(false);
  const permission = wantTilt ? requestPermission() : null;
  fullscreen.then((granted) => {
    if (granted) orientation()?.lock?.("landscape").catch(() => { /* refused: the card turns itself instead (§5.3) */ });
  }, () => {});
  return { permission, fullscreen, wakeLock: wake };
}

const toReading = (event: DeviceOrientationEvent): Reading => ({ beta: event.beta, gamma: event.gamma, t: performance.now() });
const real = (r: Reading) => typeof r.beta === "number" && typeof r.gamma === "number";

/** True once a reading with real numbers arrives, false if none does within `ms` (computers, no sensor, plain HTTP). */
export function waitForReading(ms = READING_WAIT_MS): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (ok: boolean) => { window.removeEventListener("deviceorientation", onEvent); window.clearTimeout(timer); resolve(ok); };
    const onEvent = (event: Event) => { if (real(toReading(event as DeviceOrientationEvent))) done(true); };
    const timer = window.setTimeout(() => done(false), ms);
    window.addEventListener("deviceorientation", onEvent);
  });
}

/** Feeds every orientation reading to `onReading` while `active`. */
export function useOrientation(active: boolean, onReading: (reading: Reading) => void): void {
  const callback = useRef(onReading);
  callback.current = onReading;
  useEffect(() => {
    if (!active) return;
    const onEvent = (event: Event) => callback.current(toReading(event as DeviceOrientationEvent));
    window.addEventListener("deviceorientation", onEvent);
    return () => window.removeEventListener("deviceorientation", onEvent);
  }, [active]);
}

/** The angle the browser has already turned the page (0, 90, 180, 270). */
export function screenAngle(): number {
  const angle = orientation()?.angle ?? (window as unknown as { orientation?: number }).orientation ?? 0;
  return ((angle % 360) + 360) % 360;
}
