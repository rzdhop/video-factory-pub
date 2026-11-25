import React from "react";
import type { Chapter, Lang, Preset, Series } from "../types";
import { fmtNum, partWord } from "../kit/anim";

export type HudProps = { preset: Preset; chapter: Chapter; chapters?: Chapter[]; duration?: number; p: number; t: number; width: number; height: number; hide?: number; series?: Series; lang?: Lang };

/** Text of a HUD counter (shared with the HUD builders of the styles). */
export const fmtCounter = (kind: string, v: number, unit?: string, lang: Lang = "fr"): string => {
  switch (kind) {
    case "battery":
      return `${Math.round(v)} %`;
    case "distance":
      return v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)} km` : `${Math.round(v)} m`;
    case "hertz":
      return `${Math.round(v)} Hz`;
    case "power":
      return `${lang === "fr" ? Math.round(v).toLocaleString("fr-FR") : fmtNum(Math.round(v), 0, lang)} MW`;
    case "volts":
      return `${Math.round(v)} V`;
    case "clock": {
      const s = Math.floor(v);
      return `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }
    case "count": {
      const n = Math.round(v);
      const u = unit ? (n < 2 && unit.endsWith("s") ? unit.slice(0, -1) : unit) : "";
      return `${lang === "fr" ? n.toLocaleString("fr-FR").replace(/\s/g, " ") : fmtNum(n, 0, lang)}${u ? " " + u : ""}`;
    }
    case "year":
      return String(Math.round(v));
    default:
      return `${Math.round(v)}${unit ? " " + unit : ""}`;
  }
};

/** Top HUD: progress bar, series badge, dot + chapter label (tracked caps), counter interpolated over the chapter,
 *  optional stat chips. `hud.y` is the top of the label row; the progress bar sits `hud.barAbove` px over it.
 *  Legacy layout: badge above the bar. Layout 2 (`hud.badge: "inline"`): the badge is the first item of the label
 *  row, and the whole block starts at or below 12.5 % of the height (the platform UI covers the top 12 %). */
export const Hud: React.FC<HudProps> = ({ preset, chapter, chapters = [], duration = 0, p, t, width, height, hide = 0, series, lang = "fr" }) => {
  const hud = preset.hud;
  const inline = hud.badge === "inline";
  const barAbove = hud.barAbove ?? 34;
  const badge = series?.badge ? series.badge : series ? `${partWord(lang)} ${series.part}${series.total ? `/${series.total}` : ""}` : "";
  const dot = hud.dot ? (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: hud.square ? 2 : 6,
        background: hud.square ? preset.accent : preset.accentAlt,
        opacity: Math.floor(t * 2) % 2 === 0 ? 1 : 0.35,
        display: "inline-block",
      }}
    />
  ) : null;
  const y = height * hud.y;
  const counter = chapter.hud.counter;
  // ease-out so the number settles before the chapter ends
  const e = 1 - Math.pow(1 - Math.min(1, p * 1.25), 3);
  const value = counter ? counter.start + (counter.end - counter.start) * e : null;
  // the label drops in at each chapter start; the counter kicks every time its displayed value changes
  const chapterT = t - chapter.t_start;
  const drop = Math.min(1, chapterT / 0.25);
  const shown = value !== null ? fmtCounter(counter!.kind, value, counter!.unit, lang) : "";
  const before = value !== null ? fmtCounter(counter!.kind, counter!.start + (counter!.end - counter!.start) * (1 - Math.pow(1 - Math.min(1, Math.max(0, p - 0.012) * 1.25), 3)), counter!.unit, lang) : "";
  const kick = shown !== before ? 1.06 : 1;
  const total = duration || (chapters.length ? chapters[chapters.length - 1].t_end : 1);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, textAlign: "center", color: preset.textPrimary, opacity: 1 - hide, transform: `translateY(${-hide * 40}px)` }}>
      {/* story-style progress: one segment per chapter, the current one fills up (viewers stay to see it end) */}
      {chapters.length > 1 && (
        <div style={{ position: "absolute", left: width * 0.08, right: width * 0.08, top: -barAbove, display: "flex", gap: 8 }}>
          {chapters.map((c) => {
            const k = Math.min(1, Math.max(0, (t - c.t_start) / (c.t_end - c.t_start)));
            return (
              <div key={c.key} style={{ flex: (c.t_end - c.t_start) / total, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
                <div style={{ width: `${k * 100}%`, height: "100%", background: c.key === chapter.key ? preset.accent : "rgba(255,255,255,0.85)" }} />
              </div>
            );
          })}
        </div>
      )}
      {/* legacy: the series badge sits above the progress bar (left end) */}
      {series && !inline && (
        <div
          style={{
            position: "absolute",
            left: width * 0.08,
            top: -84,
            height: 36,
            padding: "0 14px",
            borderRadius: 8,
            background: preset.accent,
            color: "#0B0B10",
            fontFamily: preset.fontMono,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: "36px",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
          }}
        >
          {badge}
        </div>
      )}
      {inline ? (
        <div style={{ fontFamily: preset.fontHud, fontSize: hud.labelSize, letterSpacing: `${hud.letterSpacing}em`, color: preset.textHud, fontWeight: 600, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, lineHeight: 1.2, minHeight: 36 }}>
          {/* series badge: first item of the label row (it stays put when the label drops in at a chapter start) */}
          {series && (
            <span style={{ height: 34, padding: "0 12px", marginRight: 6, borderRadius: 8, background: preset.accent, color: "#0B0B10", fontFamily: preset.fontMono, fontSize: 21, fontWeight: 500, lineHeight: "34px", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
              {badge}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 14, whiteSpace: "nowrap", opacity: drop, transform: `translateY(${(1 - drop) * -14}px)` }}>
            {dot}
            <span>{chapter.label}</span>
          </span>
        </div>
      ) : (
        <div
          style={{
          fontFamily: preset.fontHud,
          fontSize: hud.labelSize,
          letterSpacing: `${hud.letterSpacing}em`,
          color: preset.textHud,
          fontWeight: 600,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
          opacity: drop,
          transform: `translateY(${(1 - drop) * -14}px)`,
          }}
        >
          {dot}
          <span>{chapter.label}</span>
        </div>
      )}
      {value !== null && hud.counterSize > 0 && (
        <div
          style={{
            fontFamily: preset.fontMono,
            fontSize: hud.counterSize,
            fontWeight: 500,
            lineHeight: 1.1,
            marginTop: inline ? 2 : 6,
            fontVariantNumeric: "tabular-nums",
            transform: `scale(${kick})`,
            textShadow: "0 4px 18px rgba(0,0,0,0.5)",
          }}
        >
          {fmtCounter(counter!.kind, value, counter!.unit, lang)}
        </div>
      )}
      {chapter.hud.stats && (
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 12 }}>
          {chapter.hud.stats.map((s) => (
            <span
              key={s}
              style={{
                fontFamily: preset.fontMono,
                fontSize: 22,
                border: `2px solid ${preset.lineColor}`,
                padding: "6px 14px",
                borderRadius: 4,
              }}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
