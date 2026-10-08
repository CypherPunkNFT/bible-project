/// <reference types="vite/client" /> // for import.meta.glob below
import { useEffect, useState } from "react";
import type { Apostle, ApostleGroup, Prophet, ProphetGroup, Ruler, RulerGroup } from "@/data/people-pages/types";
import { apostleFor, prophetFor, rulerFor, type Aspect } from "@/lib/people-pages-index";

/**
 * The ruler, apostle and prophet group files (src/data/people-pages/*.json), each loaded only when a page needs it, so the
 * main bundle never carries them. index.json is the bundled summary (people-pages-index.ts), not a group.
 */
const FILES = import.meta.glob<{ default: RulerGroup | ApostleGroup | ProphetGroup }>(["/src/data/people-pages/*.json", "!/src/data/people-pages/index.json"]);

export type PeopleGroup = Partial<RulerGroup> & Partial<ApostleGroup> & Partial<ProphetGroup> & { id: string; title: string; citations: RulerGroup["citations"] };

const loaded = new Map<string, PeopleGroup>();
const pending = new Map<string, Promise<PeopleGroup | undefined>>();

/** A group file by its id (the file name without .json); undefined when there is no such file. */
export function loadPeopleGroup(id: string): Promise<PeopleGroup | undefined> {
  const done = loaded.get(id);
  if (done) return Promise.resolve(done);
  const load = FILES[`/src/data/people-pages/${id}.json`];
  if (!load) return Promise.resolve(undefined);
  let promise = pending.get(id);
  if (!promise) {
    promise = load().then((module) => {
      const group = module.default as PeopleGroup;
      loaded.set(id, group);
      return group;
    });
    promise.catch((error: unknown) => {
      console.warn(`people pages: could not load the group file ${id}.json`, error);
      pending.delete(id);
    });
    pending.set(id, promise);
  }
  return promise;
}

/** A group already loaded (for rendering inside a page transition without a loading frame). */
export const peekPeopleGroup = (id: string): PeopleGroup | undefined => loaded.get(id);

export type GroupState<T> = { status: "loading" } | { status: "missing" } | { status: "ready"; group: PeopleGroup; item: T };

function useGroupItem<T>(groupId: string | undefined, pick: (group: PeopleGroup) => T | undefined): GroupState<T> {
  const read = (): GroupState<T> => {
    const group = groupId ? peekPeopleGroup(groupId) : undefined;
    const item = group && pick(group);
    return group ? (item ? { status: "ready", group, item } : { status: "missing" }) : groupId ? { status: "loading" } : { status: "missing" };
  };
  const [state, setState] = useState<{ key: string; value: GroupState<T> }>(() => ({ key: groupId ?? "", value: read() }));
  useEffect(() => {
    if (!groupId || peekPeopleGroup(groupId)) return;
    let live = true;
    void loadPeopleGroup(groupId).then(() => { if (live) setState({ key: groupId, value: read() }); }).catch(() => { if (live) setState({ key: groupId, value: { status: "missing" } }); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `read` depends only on groupId and the item picked by it
  }, [groupId]);
  // A group loaded since (or for another page) is read straight from the cache, so a page never flashes "loading".
  return state.key === (groupId ?? "") && state.value.status !== "loading" ? state.value : read();
}

/** The ruler page's full data: the group file named in the index, then the ruler in it. */
export function useRuler(id: string): GroupState<Ruler> {
  const summary = rulerFor(id);
  return useGroupItem(summary?.group, (group) => group.rulers?.find((r) => r.id === summary?.id));
}

export function useApostle(id: string): GroupState<Apostle> {
  const summary = apostleFor(id);
  return useGroupItem(summary?.group, (group) => group.apostles?.find((a) => a.id === summary?.id));
}

export function useProphet(id: string): GroupState<Prophet> {
  const summary = prophetFor(id);
  return useGroupItem(summary?.group, (group) => group.prophets?.find((p) => p.id === summary?.id));
}

/** Everything a special page needs before it is drawn: used to wait (briefly) before a page wipe starts. */
export function preparePeoplePage(id: string, aspect: Aspect): Promise<unknown> {
  const group = aspect === "rule" ? rulerFor(id)?.group : aspect === "mission" ? apostleFor(id)?.group : prophetFor(id)?.group;
  return group ? loadPeopleGroup(group) : Promise.resolve();
}

const settled = new Map<string, unknown>();

/**
 * Like useAsync, but a value loaded before is returned on the first render: a page wiping in shows its content at
 * once instead of a loading frame. `load` must return the same data for the same key.
 */
export function useCachedLoad<T>(key: string, load: () => Promise<T>): { status: "loading" } | { status: "ready"; value: T } | { status: "error" } {
  const [state, setState] = useState<{ key: string; status: "ready" | "error" | "loading" }>({ key, status: settled.has(key) ? "ready" : "loading" });
  useEffect(() => {
    if (settled.has(key)) return;
    let live = true;
    load().then((value) => { settled.set(key, value); if (live) setState({ key, status: "ready" }); })
      .catch((error: unknown) => { console.warn(`load failed for ${key}`, error); if (live) setState({ key, status: "error" }); });
    return () => { live = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies the request; `load` is recreated every render
  }, [key]);
  if (settled.has(key)) return { status: "ready", value: settled.get(key) as T };
  return state.key === key && state.status === "error" ? { status: "error" } : { status: "loading" };
}

/** Load once and remember, so `useCachedLoad` with the same key renders at once. */
export async function preload<T>(key: string, load: () => Promise<T>): Promise<void> {
  if (settled.has(key)) return;
  settled.set(key, await load());
}
