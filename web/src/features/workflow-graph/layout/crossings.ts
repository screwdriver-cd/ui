export interface Pt {
  x: number;
  y: number;
}

export interface Polyline {
  /** Edge endpoints, used to ignore pairs that legitimately meet at a node. */
  src: string;
  dest: string;
  points: Pt[];
}

const orient = (a: Pt, b: Pt, c: Pt) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
const EPS = 1e-6;

/** Strict (proper) crossing of two segments: collinear overlaps and end touches do not count. */
export function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const o1 = orient(a, b, c);
  const o2 = orient(a, b, d);
  const o3 = orient(c, d, a);
  const o4 = orient(c, d, b);

  return ((o1 > EPS && o2 < -EPS) || (o1 < -EPS && o2 > EPS)) && ((o3 > EPS && o4 < -EPS) || (o3 < -EPS && o4 > EPS));
}

/**
 * Number of edge pairs that cross. Edges sharing an endpoint node are not
 * counted (fan-in/fan-out merges are not crossings).
 */
export function countCrossings(edges: Polyline[]): number {
  let count = 0;

  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i] as Polyline;
      const b = edges[j] as Polyline;

      if (a.src === b.src || a.dest === b.dest || a.src === b.dest || a.dest === b.src) continue;

      let crossed = false;

      for (let p = 0; p + 1 < a.points.length && !crossed; p += 1) {
        for (let q = 0; q + 1 < b.points.length && !crossed; q += 1) {
          crossed = segmentsCross(a.points[p] as Pt, a.points[p + 1] as Pt, b.points[q] as Pt, b.points[q + 1] as Pt);
        }
      }

      if (crossed) count += 1;
    }
  }

  return count;
}
