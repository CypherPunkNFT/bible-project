// The player's Daily Five record, kept in this browser only (design §7): games played, streaks, best score, the last
// 30 daily totals and today's confirmed pins. The game plays the same without storage (a private window); streaks are
// then simply not kept. Whatever is stored is rebuilt field by field, so a damaged value can never break the page.

export interface Pick { id: string; lon: number; lat: number; km: number; points: number }
export interface DayRecord { n: number; total: number }
export interface TodayRecord { n: number; ids: string[]; picks: Pick[] }
export interface Stats {
  v: 1;
  played: number;
  streak: number;
  bestStreak: number;
  best: number;
  /** The last puzzle number finished (0: none yet). */
  lastDone: number;
  history: DayRecord[];
  /** The Daily Five in progress (or just finished), so a reload resumes it. */
  today: TodayRecord | null;
}

const KEY = "bp-map-quest";
const HISTORY_KEPT = 30;
const ROUND = 5;

export const emptyStats = (): Stats => ({ v: 1, played: 0, streak: 0, bestStreak: 0, best: 0, lastDone: 0, history: [], today: null });

const count = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);
const finite = (value: unknown): number | null => (typeof value === "number" && Number.isFinite(value) ? value : null);
const record = (value: unknown): Record<string, unknown> | null => (value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null);

function parsePick(value: unknown): Pick | null {
  const v = record(value);
  if (!v || typeof v.id !== "string") return null;
  const [lon, lat, km, points] = [finite(v.lon), finite(v.lat), finite(v.km), finite(v.points)];
  if (lon === null || lat === null || km === null || points === null) return null;
  return { id: v.id, lon, lat, km, points: Math.round(points) };
}

function parseToday(value: unknown): TodayRecord | null {
  const v = record(value);
  if (!v || !Array.isArray(v.ids) || !Array.isArray(v.picks)) return null;
  const ids = v.ids.filter((id): id is string => typeof id === "string").slice(0, ROUND);
  const picks = v.picks.map(parsePick).filter((pick): pick is Pick => pick !== null).slice(0, ids.length);
  const n = count(v.n);
  return n > 0 && ids.length > 0 ? { n, ids, picks } : null;
}

/** A stored value, whatever its shape, as a sound record. */
export function parseStats(raw: unknown): Stats {
  const v = record(raw);
  if (!v) return emptyStats();
  const history = Array.isArray(v.history)
    ? v.history.map(record).flatMap((day) => (day && count(day.n) > 0 ? [{ n: count(day.n), total: count(day.total) }] : [])).slice(-HISTORY_KEPT)
    : [];
  return {
    v: 1, played: count(v.played), streak: count(v.streak), bestStreak: count(v.bestStreak), best: count(v.best),
    lastDone: count(v.lastDone), history, today: parseToday(v.today),
  };
}

export function readStats(): Stats {
  try {
    return parseStats(JSON.parse(localStorage.getItem(KEY) ?? "null"));
  } catch (error) {
    console.warn("Map quest: the saved record could not be read from this browser:", error);
    return emptyStats();
  }
}

export function writeStats(stats: Stats): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(stats));
  } catch (error) {
    console.warn("Map quest: the record could not be saved in this browser:", error);
  }
}

/** Opens puzzle n: resumes it when it is already under way, otherwise starts it afresh (an older unfinished one is dropped). */
export function startDaily(stats: Stats, n: number, ids: string[]): Stats {
  if (stats.today?.n === n) return stats;
  return { ...stats, today: { n, ids: ids.slice(0, ROUND), picks: [] } };
}

/** Saves one confirmed pin. A pin for a place already confirmed (another tab, a double tap) is refused. */
export function recordPick(stats: Stats, n: number, pick: Pick): Stats {
  const today = stats.today;
  if (!today || today.n !== n || today.picks.length >= today.ids.length || today.ids[today.picks.length] !== pick.id) return stats;
  return { ...stats, today: { ...today, picks: [...today.picks, pick] } };
}

export const dailyTotal = (today: TodayRecord): number => today.picks.reduce((sum, pick) => sum + pick.points, 0);
export const isFinished = (today: TodayRecord | null): boolean => !!today && today.picks.length >= today.ids.length;

/** Counts a finished puzzle once (finishing it again changes nothing). */
export function finishDaily(stats: Stats, n: number): Stats {
  const today = stats.today;
  if (!today || today.n !== n || !isFinished(today) || stats.lastDone >= n) return stats;
  const total = dailyTotal(today);
  const streak = stats.lastDone === n - 1 ? stats.streak + 1 : 1;
  return {
    ...stats, played: stats.played + 1, streak, bestStreak: Math.max(stats.bestStreak, streak), best: Math.max(stats.best, total),
    lastDone: n, history: [...stats.history, { n, total }].slice(-HISTORY_KEPT),
  };
}

/** The streak as it stands on puzzle `todayN`: a missed day resets it, but today does not break it until today is over. */
export const currentStreak = (stats: Stats, todayN: number): number => (stats.lastDone >= todayN - 1 ? stats.streak : 0);
