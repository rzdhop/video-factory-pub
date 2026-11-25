/** Tiny path helpers shared by Arrow and Packet: a path is a function u (0..1) -> point. */
export type Pt = [number, number];
export type PathFn = (u: number) => Pt;

export const linePath = (a: Pt, b: Pt): PathFn => (u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

/** Quadratic curve from a to b; `bend` = sideways offset of the control point as a fraction of the length
 *  (positive bends to the left of the travel direction on screen). */
export const curvePath = (a: Pt, b: Pt, bend = 0.25): PathFn => {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const cx = (a[0] + b[0]) / 2 + dy * bend, cy = (a[1] + b[1]) / 2 - dx * bend;
  return (u) => {
    const v = 1 - u;
    return [v * v * a[0] + 2 * v * u * cx + u * u * b[0], v * v * a[1] + 2 * v * u * cy + u * u * b[1]];
  };
};

/** Polyline through points, parametrised by length (constant speed). */
export const polyPath = (pts: Pt[]): PathFn => {
  const lens = [0];
  for (let i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = lens[lens.length - 1] || 1;
  return (u) => {
    const d = Math.min(1, Math.max(0, u)) * total;
    let i = 1;
    while (i < pts.length - 1 && lens[i] < d) i++;
    const s = (d - lens[i - 1]) / (lens[i] - lens[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * s, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * s];
  };
};

/** SVG path data of the path between u0 and u1. */
export const samplePath = (fn: PathFn, u0: number, u1: number, n = 28) => {
  let d = "";
  for (let i = 0; i <= n; i++) {
    const [x, y] = fn(u0 + ((u1 - u0) * i) / n);
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
};

/** Direction of travel at u, in degrees. */
export const tangentDeg = (fn: PathFn, u: number) => {
  const a = fn(Math.max(0, u - 0.01)), b = fn(Math.min(1, u + 0.01));
  return (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
};
