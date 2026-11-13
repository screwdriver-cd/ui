import {
  connectedPipelineIds,
  isExternalTrigger,
  mergeGraphs,
  pipelineNodeNames,
  prefixJobName
} from './merge';

const a = {
  id: 1,
  workflowGraph: {
    nodes: [{ name: '~commit' }, { name: 'main' }, { name: '~sd@2:deploy' }],
    edges: [
      { src: '~commit', dest: 'main' },
      { src: 'main', dest: '~sd@2:deploy' }
    ]
  }
};
const b = {
  id: 2,
  workflowGraph: {
    nodes: [{ name: '~commit' }, { name: 'deploy' }, { name: 'verify' }],
    edges: [
      { src: '~commit', dest: 'deploy' },
      { src: 'deploy', dest: 'verify' }
    ]
  }
};

describe('visualizer merge', () => {
  it('detects external triggers and prefixes names', () => {
    expect(isExternalTrigger('~sd@2:deploy')).toBe(true);
    expect(isExternalTrigger('main')).toBe(false);
    expect(prefixJobName('main', 1)).toBe('~sd@1:main');
    expect(prefixJobName('~commit', 1)).toBe('~commit');
    expect(prefixJobName('~sd@2:deploy', 1)).toBe('~sd@2:deploy');
  });

  it('finds connected pipeline ids without the pipeline itself', () => {
    expect(connectedPipelineIds(a)).toEqual(['2']);
    expect(connectedPipelineIds(b)).toEqual([]);
  });

  it('keeps entry points when nothing is connected', () => {
    const g = mergeGraphs(b, []);

    expect(g.nodes.map(n => n.name)).toEqual([
      '~commit',
      '~sd@2:deploy',
      '~sd@2:verify'
    ]);
  });

  it("prunes the selected pipeline's ~commit branch when pipelines are connected", () => {
    const g = mergeGraphs(a, [b]);

    // main only ran from ~commit, and so did everything below it, including the link
    // to ~sd@2:deploy; the connected pipeline's own jobs come back from its graph.
    expect(g.nodes.map(n => n.name)).toEqual(['~sd@2:deploy', '~sd@2:verify']);
    expect(g.edges).toEqual([{ src: '~sd@2:deploy', dest: '~sd@2:verify' }]);
  });

  it('keeps selected jobs that an upstream pipeline also triggers, and links them to the connected pipeline', () => {
    const c = {
      id: 3,
      workflowGraph: {
        nodes: [
          { name: '~commit' },
          { name: 'build' },
          { name: '~sd@7:up' },
          { name: 'main' },
          { name: '~sd@2:deploy' }
        ],
        edges: [
          { src: '~commit', dest: 'build' },
          { src: 'build', dest: 'main' },
          { src: '~sd@7:up', dest: 'main' },
          { src: 'main', dest: '~sd@2:deploy' }
        ]
      }
    };
    const up = {
      id: 7,
      workflowGraph: {
        nodes: [{ name: '~commit' }, { name: 'release' }],
        edges: [{ src: '~commit', dest: 'release' }]
      }
    };
    const g = mergeGraphs(c, [b, up]);

    expect(g.nodes.map(n => n.name)).toEqual([
      '~sd@7:up',
      '~sd@3:main',
      '~sd@2:deploy',
      '~sd@2:verify',
      '~sd@7:release'
    ]);
    expect(g.edges).toEqual([
      { src: '~sd@7:up', dest: '~sd@3:main' },
      { src: '~sd@3:main', dest: '~sd@2:deploy' },
      { src: '~sd@2:deploy', dest: '~sd@2:verify' }
    ]);
  });
});

describe('pipelineNodeNames', () => {
  it('lists the merged nodes of one pipeline', () => {
    const merged = mergeGraphs(a, [b]);

    expect([...pipelineNodeNames(merged, 2)].sort()).toEqual([
      '~sd@2:deploy',
      '~sd@2:verify'
    ]);
    expect([...pipelineNodeNames(mergeGraphs(b, []), 2)].sort()).toEqual(['~sd@2:deploy', '~sd@2:verify']);
    expect(pipelineNodeNames(merged, 99).size).toBe(0);
  });
});
