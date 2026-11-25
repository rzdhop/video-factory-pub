import dark2d from "../presets/dark-2d.json";
import sim3d from "../presets/sim-3d.json";
import type { Look, Preset } from "./types";
export const PRESETS: Record<string, Preset> = { "dark-2d": dark2d, "sim-3d": sim3d as unknown as Preset };
export const getPreset = (name: string): Preset => PRESETS[name] ?? dark2d;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
/** Deep merge of plain objects: values of `over` win, nested objects are merged key by key. */
const merge = <T,>(base: T, over: unknown): T => {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : over) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = isObj(v) && isObj(out[k]) ? merge(out[k], v) : v;
  return out as T;
};

/** A look is a partial preset (colours, lights, fonts, captions, HUD, kit style) laid over a base preset.
 *  It is resolved by tools/looks.py (episode > series > format) and embedded in episode.json, so adding a look
 *  is one JSON file in looks/ and no code change. The merged preset gets its own name: token caches key on it. */
export const applyLook = (base: Preset, look?: Look | null): Preset => {
  if (!look) return base;
  const { id, extends: _base, description: _d, ...over } = look as Look & Record<string, unknown>;
  return { ...merge(base, over), name: `${base.name}+${id ?? "look"}` };
};
/** Preset of an episode: its base preset (the look may name another one with `extends`) with its look on top. */
export const resolvePreset = (ep: { preset: string; look?: Look | null }): Preset =>
  applyLook(getPreset(ep.look?.extends ?? ep.preset), ep.look);
