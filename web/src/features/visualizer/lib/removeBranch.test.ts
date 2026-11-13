import type { WorkflowGraphData } from '~/features/workflow-graph';
import { removeBranch, removeEntryBranches } from './removeBranch';

const graph = (
  names: string[],
  edges: Array<[string, string]>
): WorkflowGraphData => ({
  nodes: names.map(name => ({ name })),
  edges: edges.map(([src, dest]) => ({ src, dest }))
});
const names = (g: WorkflowGraphData) => g.nodes.map(n => n.name);
const pairs = (g: WorkflowGraphData) => g.edges.map(e => `${e.src}>${e.dest}`);

describe('removeBranch', () => {
  it('removes the start node and the whole chain that only it leads to', () => {
    const g = graph(
      ['~commit', 'a', 'b', 'c'],
      [
        ['~commit', 'a'],
        ['a', 'b'],
        ['b', 'c']
      ]
    );
    const out = removeBranch(g, '~commit');

    expect(names(out)).toEqual([]);
    expect(out.edges).toEqual([]);
  });

  it('keeps a node that still has another incoming edge, and the branch below it', () => {
    const g = graph(
      ['~commit', 'a', 'b', '~sd@9:up', 'c'],
      [
        ['~commit', 'a'],
        ['a', 'b'],
        ['~sd@9:up', 'b'],
        ['b', 'c']
      ]
    );
    const out = removeBranch(g, '~commit');

    expect(names(out)).toEqual(['b', '~sd@9:up', 'c']);
    expect(pairs(out)).toEqual(['~sd@9:up>b', 'b>c']);
  });

  it('removes a join only once all of its parents are gone (diamond)', () => {
    const g = graph(
      ['~commit', 'a', 'b', 'join'],
      [
        ['~commit', 'a'],
        ['~commit', 'b'],
        ['a', 'join'],
        ['b', 'join']
      ]
    );

    expect(names(removeBranch(g, '~commit'))).toEqual([]);
  });

  it('does nothing when the start node has incoming edges or does not exist', () => {
    const g = graph(
      ['x', '~commit', 'a'],
      [
        ['x', '~commit'],
        ['~commit', 'a']
      ]
    );

    expect(removeBranch(g, '~commit')).toEqual(g);
    expect(removeBranch(g, '~pr')).toEqual(g);
  });

  it('never removes nodes whose only incoming edges come from a cycle', () => {
    const g = graph(
      ['~commit', 'a', 'b'],
      [
        ['~commit', 'a'],
        ['a', 'b'],
        ['b', 'a']
      ]
    );
    const out = removeBranch(g, '~commit');

    expect(names(out)).toEqual(['a', 'b']);
    expect(pairs(out)).toEqual(['a>b', 'b>a']);
  });

  it('ignores edges to nodes that are not in the graph', () => {
    const g = graph(['~commit'], [['~commit', 'ghost']]);
    const out = removeBranch(g, '~commit');

    expect(names(out)).toEqual([]);
    expect(out.edges).toEqual([]);
  });

  it('does not mutate its input', () => {
    const g = graph(['~commit', 'a'], [['~commit', 'a']]);
    const copy = structuredClone(g);

    removeBranch(g, '~commit');
    expect(g).toEqual(copy);
  });
});

describe('removeEntryBranches', () => {
  it('drops ~pr and ~commit branches but keeps jobs also fed from elsewhere', () => {
    const g = graph(
      [
        '~pr',
        '~commit',
        'pr-only',
        'shared',
        'commit-only',
        '~sd@9:up',
        'kept'
      ],
      [
        ['~pr', 'pr-only'],
        ['~pr', 'shared'],
        ['~commit', 'shared'],
        ['~commit', 'commit-only'],
        ['~sd@9:up', 'kept'],
        ['shared', 'kept']
      ]
    );
    const out = removeEntryBranches(g);

    expect(names(out)).toEqual(['~sd@9:up', 'kept']);
    expect(pairs(out)).toEqual(['~sd@9:up>kept']);
  });

  it('keeps a job reachable from ~pr and ~commit when it also has an external parent', () => {
    const g = graph(
      ['~pr', '~commit', '~sd@9:up', 'job'],
      [
        ['~pr', 'job'],
        ['~commit', 'job'],
        ['~sd@9:up', 'job']
      ]
    );

    expect(names(removeEntryBranches(g))).toEqual(['~sd@9:up', 'job']);
  });
});
