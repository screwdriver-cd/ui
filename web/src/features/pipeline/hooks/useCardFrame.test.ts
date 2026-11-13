import type { LayoutResult } from '~/features/workflow-graph/layout/types';
import type { Build } from '../types';
import {
  FOCUS_IDLE,
  focusFrame,
  frameStatus,
  packFrame,
  placeFrame
} from './useCardFrame';

// ~commit -> a -> b, a -> c: b and c have the same shape, so a subgraph alone cannot tell them apart.
const graph = {
  nodes: [
    { name: '~commit' },
    { name: 'a', id: 1 },
    { name: 'b', id: 2 },
    { name: 'c', id: 3 },
    // Folded away by the layout, still part of the pipeline.
    { name: 'stage@x:setup', id: 4, virtual: true }
  ],
  edges: [
    { src: '~commit', dest: 'a' },
    { src: 'a', dest: 'b' },
    { src: 'a', dest: 'c' }
  ]
};
const placed = (id: string, x: number, y: number) => ({
  id,
  x,
  y,
  width: 18,
  height: 18
});
const layout = {
  nodes: [
    placed('c', 80, 40),
    placed('a', 40, 20),
    placed('~commit', 0, 20),
    placed('b', 80, 0)
  ],
  edges: [],
  stages: []
} as unknown as LayoutResult;
const build = (id: number, jobId: number, status: string) =>
  ({ id, jobId, status, createTime: '' }) as Build;

describe('card frame', () => {
  it('orders nodes left to right, then top to bottom', () => {
    const frame = placeFrame(graph, layout);

    expect(frame.nodes.map(n => n.name)).toEqual(['~commit', 'a', 'b', 'c']);
    expect(frame.nodes[1]).toMatchObject({ jobId: 1, kind: 'job' });
    expect(frame.nodes[0]).toMatchObject({ kind: 'trigger' });
    expect([frame.width, frame.height]).toEqual([98, 58]);
  });

  it('tells apart events that ran different jobs of the same shape', () => {
    const frame = placeFrame(graph, layout);
    const one = frameStatus(
      frame,
      [build(1, 1, 'SUCCESS'), build(2, 2, 'SUCCESS')],
      new Set()
    );
    const two = frameStatus(
      frame,
      [build(3, 1, 'SUCCESS'), build(4, 3, 'SUCCESS')],
      new Set()
    );

    expect([...one.byJob.keys()]).toEqual([1, 2]);
    expect([...two.byJob.keys()]).toEqual([1, 3]);
  });

  it('packs columns onto a grid, wrapping a tall column', () => {
    const tall = {
      nodes: [
        { name: '~commit' },
        ...Array.from({ length: 12 }, (_, i) => ({ name: `d${i}`, id: i + 1 }))
      ],
      edges: []
    };
    const frame = placeFrame(tall, {
      nodes: [
        placed('~commit', 0, 0),
        ...tall.nodes.slice(1).map((n, i) => placed(n.name, 40, i * 30))
      ],
      edges: [],
      stages: []
    } as unknown as LayoutResult);
    const grid = packFrame(frame);

    expect(grid.cells.get('~commit')).toEqual({ col: 0, row: 0, band: 0 });
    // 12 jobs in one column: wrapped into side-by-side columns rather than one 12-row sliver.
    expect(grid.rows).toBeLessThan(12);
    expect(grid.cols).toBe(1 + Math.ceil(12 / grid.rows));
    expect(grid.cells.get('d1')).toEqual({ col: 1, row: 1, band: 0 });
    expect(packFrame(frame)).toBe(grid);
  });

  it('wraps a long pipeline into bands', () => {
    const names = Array.from({ length: 60 }, (_, i) => `j${i}`);
    const chain = {
      nodes: names.map((name, i) => ({ name, id: i + 1 })),
      edges: names.slice(1).map((dest, i) => ({ src: `j${i}`, dest }))
    };
    const frame = placeFrame(chain, {
      nodes: names.map((n, i) => placed(n, i * 40, 0)),
      edges: [],
      stages: []
    } as unknown as LayoutResult);
    const grid = packFrame(frame);
    const bands = new Set([...grid.cells.values()].map(c => c.band));

    // 60 columns in one row would leave each cell under 5px.
    expect(bands.size).toBeGreaterThan(1);
    expect(grid.cols).toBeLessThan(60);
    expect(grid.cells.get('j0')).toEqual({ col: 0, row: 0, band: 0 });
  });

  it('squeezes the rows and columns where nothing ran', () => {
    const frame = placeFrame(graph, layout);
    // Only a and b ran: c's row (y 40) and the trigger's column shrink, b's row keeps full room.
    const focus = focusFrame(frame, n => n.name === 'a' || n.name === 'b');

    const b = focus.cells.get('b');

    expect(b?.x).toBeCloseTo(FOCUS_IDLE + 1.5);
    expect(b?.y).toBeCloseTo(0.5);
    expect(b?.size).toBe(1);
    expect(focus.cells.get('~commit')?.size).toBe(FOCUS_IDLE);
    expect(focus.width).toBeCloseTo(FOCUS_IDLE + 2);
    expect(focus.height).toBeCloseTo(2 + FOCUS_IDLE);
  });

  it('stacks a run too tall for the card by column, wrapping a tall column', () => {
    // A fan-out of 12 jobs that all ran, each in a row of its own.
    const names = Array.from({ length: 12 }, (_, i) => `f${i}`);
    const fan = {
      nodes: [
        { name: 'a', id: 100 },
        ...names.map((name, i) => ({ name, id: i + 1 }))
      ],
      edges: names.map(dest => ({ src: 'a', dest }))
    };
    const frame = placeFrame(fan, {
      nodes: [placed('a', 0, 0), ...names.map((n, i) => placed(n, 40, i * 30))],
      edges: [],
      stages: []
    } as unknown as LayoutResult);
    const focus = focusFrame(frame, () => true, 8);

    expect(focus.height).toBe(8);
    // a, then the fan wrapped into two side-by-side columns of 8 and 4.
    expect(focus.width).toBe(3);
    expect(focus.cells.get('f7')).toEqual({ x: 1.5, y: 7.5, size: 1, band: 0 });
    expect(focus.cells.get('f8')).toEqual({ x: 2.5, y: 0.5, size: 1, band: 0 });
  });

  it('keeps the newest build of a job and counts jobs no longer in the graph', () => {
    const frame = placeFrame(graph, layout);
    const status = frameStatus(
      frame,
      [
        build(5, 1, 'FAILURE'),
        build(9, 1, 'SUCCESS'),
        build(6, 42, 'SUCCESS'),
        build(7, 77, 'SUCCESS'),
        build(8, 4, 'SUCCESS')
      ],
      new Set([77])
    );

    expect(status.byJob.get(1)).toBe('SUCCESS');
    expect(status.byJob.has(2)).toBe(false);
    expect(status.removed).toBe(1);
  });
});
