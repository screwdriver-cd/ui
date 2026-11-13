import { describe, expect, it } from 'vitest';
import { countCrossings, segmentsCross } from './crossings';

const line = (src: string, dest: string, ...pts: Array<[number, number]>) => ({ src, dest, points: pts.map(([x, y]) => ({ x, y })) });

describe('countCrossings', () => {
  it('detects an X', () => {
    expect(segmentsCross({ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 0, y: 2 }, { x: 2, y: 0 })).toBe(true);
    expect(countCrossings([line('a', 'b', [0, 0], [2, 2]), line('c', 'd', [0, 2], [2, 0])])).toBe(1);
  });

  it('ignores edges that share a node and parallel edges', () => {
    expect(countCrossings([line('a', 'b', [0, 0], [2, 2]), line('a', 'd', [0, 0], [2, 0])])).toBe(0);
    expect(countCrossings([line('a', 'b', [0, 0], [2, 0]), line('c', 'd', [0, 1], [2, 1])])).toBe(0);
    expect(countCrossings([line('a', 'b', [0, 0], [4, 0]), line('c', 'd', [1, 0], [3, 0])])).toBe(0);
  });
});
