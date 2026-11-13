import { describe, expect, it } from 'vitest';
import type { FlowState } from '../lens';
import { buildModel } from '../model/model';
import {
  fitZoom,
  focusViewport,
  layoutBounds,
  pickFocus
} from './initialFocus';

const model = (edges: Array<[string, string]>, extra: string[] = []) =>
  buildModel(
    {
      nodes: [...new Set([...edges.flat(), ...extra])].map(name => ({ name })),
      edges: edges.map(([src, dest]) => ({ src, dest }))
    },
    { log: () => {} }
  ).graph;

// ~commit -> a -> b -> c, ~commit -> d, ~pr -> p
const chain = model([
  ['~commit', 'a'],
  ['a', 'b'],
  ['b', 'c'],
  ['~commit', 'd'],
  ['~pr', 'p']
]);
const states = (s: Record<string, FlowState>) => new Map(Object.entries(s));

describe('pickFocus', () => {
  it('picks the running job deepest from the start', () => {
    expect(
      pickFocus({
        model: chain,
        states: states({ a: 'running', c: 'running', d: 'running' }),
        startedFrom: ['~commit']
      })
    ).toBe('c');
  });

  it('breaks a depth tie by the right-most node, then by name', () => {
    const g = model([
      ['~commit', 'x'],
      ['~commit', 'y']
    ]);
    const s = states({ x: 'running', y: 'running' });

    expect(
      pickFocus({
        model: g,
        states: s,
        startedFrom: ['~commit'],
        xOf: n => (n === 'x' ? 500 : 100)
      })
    ).toBe('x');
    expect(pickFocus({ model: g, states: s, startedFrom: ['~commit'] })).toBe(
      'x'
    );
  });

  it('uses queued or blocked builds when nothing is running', () => {
    expect(
      pickFocus({
        model: chain,
        states: states({ a: 'done', b: 'queued' }),
        startedFrom: ['~commit']
      })
    ).toBe('b');
  });

  it('centres a finished event on where it started', () => {
    expect(
      pickFocus({
        model: chain,
        states: states({ a: 'done', b: 'failed' }),
        startedFrom: ['~commit']
      })
    ).toBe('~commit');
  });

  it('finds a restart from a job name, with or without the PR prefix', () => {
    expect(pickFocus({ model: chain, states: states({}), start: 'b' })).toBe(
      'b'
    );
    expect(
      pickFocus({ model: chain, states: states({}), start: 'PR-12:p' })
    ).toBe('p');
    // depth counts from the restarted job: c (1 hop) beats a (unreached)
    expect(
      pickFocus({
        model: chain,
        states: states({ a: 'running', c: 'running' }),
        start: 'b'
      })
    ).toBe('c');
  });

  it('falls back to the first root when the start is not in the graph', () => {
    expect(
      pickFocus({ model: chain, states: states({}), start: '~sd@1:gone' })
    ).toBe('~commit');
  });

  it('copes with cycles', () => {
    const g = model([
      ['~commit', 'a'],
      ['a', 'b'],
      ['b', 'a']
    ]);

    expect(
      pickFocus({
        model: g,
        states: states({ a: 'running', b: 'running' }),
        startedFrom: ['~commit']
      })
    ).toBe('b');
  });

  it('returns null for an empty graph', () => {
    expect(pickFocus({ model: model([]), states: states({}) })).toBeNull();
  });
});

describe('focusViewport', () => {
  const pane = { width: 1000, height: 600 };
  const bounds = { x: 0, y: 0, width: 4000, height: 3000 };

  it('centres on the focus when it is far from the edges', () => {
    const v = focusViewport(
      bounds,
      { x: 1950, y: 1480, width: 100, height: 40 },
      pane,
      0.8
    );

    expect(v.zoom).toBe(0.8);
    expect(v.x + 2000 * 0.8).toBeCloseTo(500);
    expect(v.y + 1500 * 0.8).toBeCloseTo(300);
  });

  it('keeps the graph against the pane edge instead of centring a corner node', () => {
    const v = focusViewport(
      bounds,
      { x: 0, y: 0, width: 100, height: 32 },
      pane,
      0.8
    );

    expect(v.x).toBe(24);
    expect(v.y).toBe(24);
  });

  it('centres an axis on which the graph is smaller than the pane', () => {
    const v = focusViewport(
      { x: 0, y: 0, width: 4000, height: 200 },
      { x: 0, y: 0, width: 100, height: 32 },
      pane,
      0.8
    );

    expect(v.y).toBeCloseTo((600 - 160) / 2);
  });
});

describe('fitZoom / layoutBounds', () => {
  it('measures nodes and stage boxes together', () => {
    expect(
      layoutBounds({
        nodes: [{ id: 'a', x: 10, y: 20, width: 100, height: 44 }],
        stages: [
          { id: 'stage:s', name: 's', x: 200, y: 0, width: 300, height: 400 }
        ]
      })
    ).toEqual({ x: 10, y: 0, width: 490, height: 400 });
  });

  it('is the tighter of the two axes', () => {
    expect(
      fitZoom(
        { x: 0, y: 0, width: 1600, height: 400 },
        { width: 1000, height: 600 },
        0.1
      )
    ).toBeCloseTo(0.5);
  });
});
