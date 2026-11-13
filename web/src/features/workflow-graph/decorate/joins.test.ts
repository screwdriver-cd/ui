import { describe, expect, it } from 'vitest';
import { computeJoins } from './joins';

// JOIN_GRAPH AND/OR and mixed AND-with-alternatives cases live in eligibility.test.ts.

describe('computeJoins', () => {
  it('omits nodes with a single incoming edge, even a join edge', () => {
    const j = computeJoins([
      { src: 'a', dest: 'b' },
      { src: 'b', dest: 'c', join: true }
    ]);

    expect(j.size).toBe(0);
  });

  it('treats a single join edge among several inputs as an OR join over all of them', () => {
    const j = computeJoins([
      { src: 'a', dest: 'x', join: true },
      { src: 'b', dest: 'x' },
      { src: 'c', dest: 'x' }
    ]);

    expect(j.get('x')).toEqual({
      kind: 'OR',
      inputs: ['a', 'b', 'c'],
      alternatives: []
    });
  });

  it('computes each destination independently and keeps edge order for inputs', () => {
    const j = computeJoins([
      { src: 'b', dest: 'and', join: true },
      { src: 'a', dest: 'or' },
      { src: 'a', dest: 'and', join: true },
      { src: 'b', dest: 'or' },
      { src: 'c', dest: 'and' },
      { src: 'd', dest: 'and' }
    ]);

    expect([...j.keys()]).toEqual(['and', 'or']);
    expect(j.get('and')).toEqual({
      kind: 'AND',
      inputs: ['b', 'a'],
      alternatives: ['c', 'd']
    });
    expect(j.get('or')).toEqual({
      kind: 'OR',
      inputs: ['a', 'b'],
      alternatives: []
    });
  });

  it('returns an empty map for no edges', () => {
    expect(computeJoins([]).size).toBe(0);
  });
});
