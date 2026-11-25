import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { applyLook, getPreset } from "./presets";
import type { Look } from "./types";
import {
  kit, clamp01, type KitTokens, curvePath, samplePath,
  Tag, GlossaryChip, Callout, AnalogyPanel, MiniMap, StepDots, Stamp,
  CountUp, AxisPlot, BarRow, Formula, F, Scale, Timeline,
  Arrow, Packet, Block, Win, CodeLines, ByteRow,
  Atom, Wave, Planet, Cell, Particles,
} from "./kit";

/** Catalogue of the kit (src/kit): every part in a labelled grid. `k` runs 0 -> 1 over the first 3 s,
 *  then the parts keep their idle motion on `t`. Two pages: page 1 = Explain + Data, page 2 = Flow + Nature. */

type Box = { x: number; y: number; w: number; h: number };
type Ctx = { b: Box; k: number; t: number; tk: KitTokens };
type CellDef = { name: string; family: string; col: 0 | 1 | "full"; y: number; h: number; draw: (c: Ctx) => React.ReactNode };

const PAGE1: CellDef[] = [
  { name: "GlossaryChip", family: "explain", col: 0, y: 120, h: 200, draw: ({ b, k, t, tk }) => <GlossaryChip x={b.x + 10} y={b.y - 4} term="Entropie" meaning="mesure du désordre" k={k} t={t} tk={tk} /> },
  { name: "Callout", family: "explain", col: 1, y: 120, h: 200, draw: ({ b, k, t, tk }) => (
    <g>
      <Atom x={b.x + 90} y={b.y + 72} r={62} k={k} t={t} tk={tk} />
      <Callout x={b.x + 90} y={b.y + 72} lx={b.x + 250} ly={b.y + 14} text="Noyau" k={k} t={t} tk={tk} />
      <Callout x={b.x + 143} y={b.y + 100} lx={b.x + 250} ly={b.y + 100} text="Électron" color={tk.color.cyan} k={k} t={t} tk={tk} />
    </g>
  ) },
  { name: "AnalogyPanel (morph 0 et 0.6)", family: "explain", col: 0, y: 330, h: 300, draw: ({ b, k, t, tk }) => (
    <g>
      <circle cx={b.x + b.w - 40} cy={b.y + 150} r={10} fill={tk.color.accent} />
      <AnalogyPanel x={b.x} y={b.y + 6} w={270} h={216} title="Comme une corde" k={k} t={t} tk={tk}>
        <Wave x={8} y={70} w={222} amp={34} freq={2} standing k={k} t={t} tk={tk} />
      </AnalogyPanel>
      <AnalogyPanel x={b.x} y={b.y + 6} w={270} h={216} title="Comme une corde" k={k} t={t} morph={0.6} to={[b.x + b.w - 40, b.y + 150]} tk={tk}>
        <Wave x={8} y={70} w={222} amp={34} freq={2} standing k={k} t={t} tk={tk} />
      </AnalogyPanel>
    </g>
  ) },
  { name: "MiniMap", family: "explain", col: 1, y: 330, h: 300, draw: ({ b, k, t, tk }) => <MiniMap x={b.x + 120} y={b.y + 4} w={230} layers={["Application", "Transport", "Réseau", "Liaison", "Physique"]} current={1} k={k} t={t} tk={tk} /> },
  { name: "StepDots", family: "explain", col: 0, y: 640, h: 150, draw: ({ b, k, t, tk }) => <StepDots x={b.x + 80} y={b.y + 40} n={5} current={3} k={k} t={t} tk={tk} /> },
  { name: "Tag", family: "explain", col: 1, y: 640, h: 150, draw: ({ b, k, t, tk }) => (
    <g>
      <Tag x={b.x + 10} y={b.y + 40} text="En direct" k={k} t={t} tk={tk} />
      <Tag x={b.x + 200} y={b.y + 40} text="Mesuré en 2019" color={tk.color.cyan} filled k={k} t={t} tk={tk} />
    </g>
  ) },
  { name: "Stamp", family: "explain", col: 0, y: 800, h: 200, draw: ({ b, k, t, tk }) => (
    <g>
      <Stamp x={b.x + 105} y={b.y + 62} size={60} text="Faux" k={k} t={t} tk={tk} />
      <Stamp x={b.x + 335} y={b.y + 62} text="Vérifié" color={tk.color.green} rot={5} size={48} k={k} t={t} tk={tk} />
    </g>
  ) },
  { name: "CountUp", family: "data", col: 1, y: 800, h: 200, draw: ({ b, k, t, tk }) => <CountUp x={b.x + b.w / 2} y={b.y + 76} to={299792} unit="km/s" label="vitesse de la lumière" size={76} k={k} t={t} tk={tk} /> },
  { name: "AxisPlot", family: "data", col: 0, y: 1010, h: 330, draw: ({ b, k, t, tk }) => (
    <AxisPlot x={b.x + 16} y={b.y + 30} w={b.w - 50} h={200} fn={(v) => 100 / (1 + Math.exp(-(v - 5) * 1.1))} xRange={[0, 10]} yRange={[0, 110]}
      xLabel="temps (s)" yLabel="charge (%)" valueLabel={(_, v) => `${Math.round(v)} %`} k={k} t={t} dotAt={k >= 1 ? 0.62 + 0.38 * Math.sin(t * 1.2) : undefined} tk={tk} />
  ) },
  { name: "BarRow", family: "data", col: 1, y: 1010, h: 330, draw: ({ b, k, t, tk }) => (
    <BarRow x={b.x + 6} y={b.y + 4} w={b.w - 12} unit=" W" k={k} t={t} tk={tk}
      rows={[{ label: "Cerveau humain", value: 20 }, { label: "Ampoule LED", value: 9 }, { label: "Ordinateur portable", value: 65 }]} />
  ) },
  { name: "Formula (highlight)", family: "data", col: 0, y: 1350, h: 220, draw: ({ b, k, t, tk }) => (
    <Formula x={b.x + b.w / 2} y={b.y + 92} anchor="middle" size={54} highlight={4} k={k} t={t} tk={tk}
      tokens={[F.sub("E", "c"), F.text(" = "), F.frac("1", "2"), F.text(" m "), F.sup("v", "2")]} />
  ) },
  { name: "Scale", family: "data", col: 1, y: 1350, h: 220, draw: ({ b, k, t, tk }) => (
    <Scale x={b.x + 6} y={b.y - 12} w={b.w - 12} rowH={80} k={k} t={t} tk={tk}
      a={{ label: "Terre", value: 12742, display: "12 742 km" }} b={{ label: "Lune", value: 3474, display: "3 474 km" }} />
  ) },
  { name: "Timeline", family: "data", col: "full", y: 1580, h: 300, draw: ({ b, k, t, tk }) => (
    <Timeline x={b.x + 10} y={b.y + 100} w={b.w - 20} current={2} k={k} t={t} tk={tk}
      events={[{ date: "1687", label: "Newton\ngravitation" }, { date: "1865", label: "Maxwell\nondes" }, { date: "1905", label: "Einstein\nrelativité" }, { date: "1969", label: "Apollo 11\nla Lune" }, { date: "2015", label: "LIGO\nondes grav." }]} />
  ) },
];

const PAGE2: CellDef[] = [
  { name: "Arrow", family: "flow", col: 0, y: 120, h: 220, draw: ({ b, k, t, tk }) => (
    <g>
      <Arrow from={[b.x + 10, b.y + 30]} to={[b.x + b.w - 20, b.y + 30]} label="requête" k={k} t={t} tk={tk} />
      <Arrow from={[b.x + b.w - 20, b.y + 112]} to={[b.x + 20, b.y + 128]} bend={-0.12} color={tk.color.accent} flow label="réponse" k={k} t={t} tk={tk} />
    </g>
  ) },
  { name: "Packet", family: "flow", col: 1, y: 120, h: 220, draw: ({ b, k, t, tk }) => {
    const p = curvePath([b.x + 96, b.y + 96], [b.x + b.w - 96, b.y + 96], 0.3);
    return (
      <g>
        <path d={samplePath(p, 0, clamp01(k))} fill="none" stroke={tk.color.grid} strokeWidth={tk.stroke.base} strokeDasharray="4 10" strokeLinecap="round" />
        <Block x={b.x} y={b.y + 68} w={96} h={56} label="A" k={k} t={t} tk={tk} />
        <Block x={b.x + b.w - 96} y={b.y + 68} w={96} h={56} label="B" k={k} t={t} tk={tk} />
        <Packet path={p} k={k < 1 ? k : (t * 0.45) % 1} t={t} tk={tk} />
        <Packet path={p} k={k < 1 ? k * 0.5 : (t * 0.45 + 0.5) % 1} t={t} color={tk.color.accent} tk={tk} />
      </g>
    );
  } },
  { name: "Block", family: "flow", col: 0, y: 350, h: 290, draw: ({ b, k, t, tk }) => (
    <g>
      <Block x={b.x + 20} y={b.y - 4} w={b.w - 40} h={54} label="Application" color={tk.color.violet} k={clamp01(k * 1.6)} t={t} tk={tk} />
      <Block x={b.x + 20} y={b.y + 68} w={b.w - 40} h={76} label="Noyau" sub="mode privilégié" color="#2F8F83" active k={clamp01(k * 1.6 - 0.25)} t={t} tk={tk} />
      <Block x={b.x + 20} y={b.y + 162} w={b.w - 40} h={54} label="Matériel" k={clamp01(k * 1.6 - 0.5)} t={t} tk={tk} />
    </g>
  ) },
  { name: "Win", family: "flow", col: 1, y: 350, h: 290, draw: ({ b, k, t, tk }) => (
    <Win x={b.x + 10} y={b.y} w={b.w - 20} h={206} title="moniteur" k={k} t={t} tk={tk}>
      <Wave x={24} y={77} w={b.w - 68} amp={44} freq={2.5} speed={0.6} k={k} t={t} color={tk.color.green} tk={tk} />
    </Win>
  ) },
  { name: "CodeLines", family: "flow", col: 0, y: 650, h: 280, draw: ({ b, k, t, tk }) => (
    <CodeLines x={b.x + 4} y={b.y - 8} w={b.w - 8} highlight={2} illustratif k={k} t={t} tk={tk}
      lines={["// lecture d'un capteur", "fd = open(\"/dev/temp\")", "val = read(fd, 4)", "if (val > 90) alert()", "close(fd)"]} />
  ) },
  { name: "ByteRow", family: "flow", col: 1, y: 650, h: 280, draw: ({ b, k, t, tk }) => (
    <ByteRow x={b.x + 14} y={b.y + 8} highlight={[10, 13]} k={k} t={t} tk={tk}
      bytes={[0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x3e, 0x00, 0xde, 0xad, 0xbe, 0xef, 0x10, 0x40, 0x00, 0x00, 0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x0a]} />
  ) },
  { name: "Atom", family: "nature", col: 0, y: 940, h: 370, draw: ({ b, k, t, tk }) => <Atom x={b.x + b.w / 2} y={b.y + 140} r={150} electrons={3} k={k} t={t} tk={tk} /> },
  { name: "Planet (ring)", family: "nature", col: 1, y: 940, h: 370, draw: ({ b, k, t, tk }) => (
    <g>
      <Planet x={b.x + 190} y={b.y + 150} r={96} color="#D9A441" ring ringColor="#E8D3A0" k={k} t={t} tk={tk} />
      <Planet x={b.x + 410} y={b.y + 30} r={40} k={k} t={t + 2} tk={tk} />
    </g>
  ) },
  { name: "Cell", family: "nature", col: 0, y: 1320, h: 330, draw: ({ b, k, t, tk }) => <Cell x={b.x + b.w / 2} y={b.y + 126} r={112} k={k} t={t} tk={tk} /> },
  { name: "Wave (travelling / standing)", family: "nature", col: 1, y: 1320, h: 330, draw: ({ b, k, t, tk }) => (
    <g>
      <Wave x={b.x + 10} y={b.y + 60} w={b.w - 20} amp={42} freq={3} k={k} t={t} tk={tk} />
      <Wave x={b.x + 10} y={b.y + 196} w={b.w - 20} amp={42} freq={2} speed={0.5} standing color={tk.color.pink} k={k} t={t} tk={tk} />
    </g>
  ) },
  { name: "Particles", family: "nature", col: "full", y: 1660, h: 220, draw: ({ b, k, t, tk }) => (
    <Particles x={b.x} y={b.y} w={b.w} h={b.h} n={70} colors={[tk.color.text, tk.color.cyan, tk.color.accent, tk.color.pink]} k={k} t={t} tk={tk} />
  ) },
];

export const KitSheet: React.FC<{ preset?: string; page?: number; look?: Look | null }> = ({ preset = "dark-2d", page = 1, look = null }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const p = applyLook(getPreset(look?.extends ?? preset), look);
  const tk = kit(p);
  const t = frame / fps, k = clamp01(t / 3);
  const cells = page === 2 ? PAGE2 : PAGE1;
  const M = 30, GAP = 20, CW = (width - 2 * M - GAP) / 2;
  const famColor: Record<string, string> = { explain: tk.color.accent, data: tk.color.cyan, flow: tk.color.pink, nature: tk.color.green };
  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${p.bg.top}, ${p.bg.bottom})` }}>
      <svg width={width} height={height}>
        <text x={M} y={78} fontFamily={tk.font.display} fontSize={60} fill={tk.color.text}>KIT<tspan dx={22} fill={tk.color.accent}>{page === 2 ? "FLOW + NATURE" : "EXPLAIN + DATA"}</tspan></text>
        <text x={width - M} y={74} textAnchor="end" fontFamily={tk.font.mono} fontWeight={500} fontSize={24} fill={tk.color.textDim}>page {page === 2 ? 2 : 1}/2  k={k.toFixed(2)}  t={t.toFixed(1)}s</text>
        {cells.map((c) => {
          const x = c.col === "full" ? M : M + c.col * (CW + GAP), w = c.col === "full" ? width - 2 * M : CW;
          const b: Box = { x: x + 20, y: c.y + 58, w: w - 40, h: c.h - 74 };
          return (
            <g key={c.name}>
              <rect x={x} y={c.y} width={w} height={c.h} rx={tk.radius.lg} fill="rgba(255,255,255,0.045)" stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
              <rect x={x + 18} y={c.y + 20} width={8} height={22} rx={4} fill={famColor[c.family]} />
              <text x={x + 36} y={c.y + 39} fontFamily={tk.font.ui} fontWeight={600} fontSize={22} fill={tk.color.textDim} letterSpacing={1.5}>{c.name}</text>
              {c.draw({ b, k, t, tk })}
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
