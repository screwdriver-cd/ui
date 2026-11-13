import type { WorkflowGraphProps } from '../render/types';
import {
  COMPLEX_GRAPH,
  JOIN_GRAPH,
  ONLY_DETACHED_GRAPH,
  RELEASE_GRAPH,
  RELEASE_JOBS,
  RELEASE_STAGES,
  STAGES,
  STAGES_GRAPH,
  STAGE_JOBS
} from './graphs';
import { stressGraph } from './stress';
import type { BuildLite, WorkflowGraphData } from '../types';

export type BenchFixture =
  | 'stages'
  | 'collapsed'
  | 'production'
  | 'pr-chain'
  | 'external'
  | 'joins'
  | 'stress'
  | 'mini'
  | 'only-detached'
  | 'fan-out';

type Props = Omit<WorkflowGraphProps, 'onSelectJob' | 'onJobAction'>;

const b = (
  id: number,
  jobId: number,
  status: string,
  parentBuildId?: BuildLite['parentBuildId']
): BuildLite => ({ id, jobId, status, parentBuildId });

const stageBuilds: BuildLite[] = [
  b(1, 1, 'SUCCESS'),
  b(2, 2, 'SUCCESS', 1),
  b(21, 21, 'SUCCESS', 2),
  b(22, 22, 'SUCCESS', 21),
  b(23, 23, 'RUNNING', 22)
];

/** ~pr and ~commit each feed many jobs that then converge, with detached jobs below them. */
const fanOut = ((): WorkflowGraphData => {
  const names = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => `${prefix}-${i + 1}`);
  const pr = names('pr-check', 9);
  const commit = names('build', 5);
  const tail = ['package', 'publish'];
  const detached = ['cleanup-a', 'cleanup-b'];
  const all = [...pr, ...commit, ...tail, ...detached];

  return {
    nodes: [
      { name: '~pr' },
      { name: '~commit' },
      ...all.map((name, i) => ({ name, id: i + 1 }))
    ],
    edges: [
      ...pr.map(dest => ({ src: '~pr', dest })),
      ...commit.map(dest => ({ src: '~commit', dest })),
      ...pr.slice(0, 6).map(src => ({ src, dest: 'package', join: true })),
      ...commit.map(src => ({ src, dest: 'package', join: true })),
      { src: 'package', dest: 'publish' }
    ]
  };
})();

const prChain: WorkflowGraphData = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { name: 'main', id: 1 },
    { name: 'lint', id: 2 },
    { name: 'test', id: 3 },
    { name: 'package', id: 4 },
    { name: 'preview-deploy', id: 5 },
    { name: 'publish', id: 6 }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'lint' },
    { src: 'main', dest: 'test' },
    { src: 'lint', dest: 'package', join: true },
    { src: 'test', dest: 'package', join: true },
    { src: 'package', dest: 'preview-deploy' },
    { src: 'preview-deploy', dest: 'publish' }
  ]
};

const external: WorkflowGraphData = {
  nodes: [
    { name: '~commit' },
    { name: 'main', id: 1 },
    { name: 'ビルドとテスト', id: 2, displayName: 'ビルドとテスト（日本語）' },
    { name: 'sd@123:deploy' },
    { name: '~sd@456:upstream' },
    { name: 'after-external', id: 3 },
    { name: '~sd-main-triggers', triggers: ['~sd@9:x', '~sd@10:y'] },
    { name: 'a-very-long-job-name-that-needs-truncation-in-the-graph', id: 4 }
  ],
  edges: [
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'ビルドとテスト' },
    { src: 'main', dest: 'sd@123:deploy' },
    { src: '~sd@456:upstream', dest: 'after-external' },
    { src: 'sd@123:deploy', dest: 'after-external' },
    {
      src: 'ビルドとテスト',
      dest: 'a-very-long-job-name-that-needs-truncation-in-the-graph'
    },
    { src: 'main', dest: '~sd-main-triggers' }
  ]
};

/** Deterministic props for each benchmark graph (Playwright visual + timing specs). */
export function benchProps(name: BenchFixture): Props {
  switch (name) {
    case 'stages':
      return {
        graph: STAGES_GRAPH,
        stages: STAGES,
        jobs: STAGE_JOBS,
        builds: stageBuilds,
        start: '~commit',
        collapsedStages: new Set(),
        minimap: false
      };
    case 'collapsed':
      return {
        graph: STAGES_GRAPH,
        stages: STAGES,
        jobs: STAGE_JOBS,
        builds: stageBuilds,
        start: '~commit',
        collapsedStages: new Set(['integration']),
        minimap: false
      };
    case 'production':
      return {
        graph: RELEASE_GRAPH,
        stages: RELEASE_STAGES,
        jobs: RELEASE_JOBS,
        builds: stageBuilds,
        start: '~commit',
        collapsedStages: new Set(),
        minimap: false
      };
    case 'pr-chain':
      return {
        graph: prChain,
        chainPR: true,
        prNum: 123,
        start: '~pr',
        activeTab: 'pulls',
        builds: [
          b(1, 1, 'SUCCESS'),
          b(2, 2, 'SUCCESS', 1),
          b(3, 3, 'FAILURE', 1),
          b(4, 4, 'QUEUED', [2, 3])
        ]
      };
    case 'external':
      return {
        graph: external,
        start: '~commit',
        builds: [b(1, 1, 'SUCCESS'), b(2, 2, 'RUNNING', 1)],
        downstreamTriggers: []
      };
    case 'joins':
      return {
        graph: JOIN_GRAPH,
        start: '~commit',
        builds: [
          b(1, 1, 'SUCCESS'),
          b(2, 2, 'SUCCESS', 1),
          b(3, 3, 'RUNNING', 1),
          b(4, 4, 'FAILURE', 1)
        ]
      };
    case 'only-detached':
      return {
        graph: ONLY_DETACHED_GRAPH,
        start: '~commit',
        builds: [b(1, 4, 'SUCCESS'), b(2, 1, 'SUCCESS')],
        minimap: false
      };
    case 'fan-out':
      return {
        graph: fanOut,
        start: '~commit',
        builds: [b(1, 1, 'SUCCESS'), b(2, 15, 'RUNNING', 1)],
        minimap: false
      };
    case 'mini':
      return {
        graph: STAGES_GRAPH,
        stages: STAGES,
        jobs: STAGE_JOBS,
        builds: stageBuilds,
        start: '~commit',
        collapsedStages: new Set(),
        variant: 'mini'
      };
    case 'stress': {
      const { graph, stageMeta } = stressGraph(8, 36);
      const jobs = graph.nodes.filter(n => n.id !== undefined);
      const done = jobs
        .slice(0, 120)
        .map((n, i) =>
          b(
            1000 + i,
            n.id as number,
            i % 17 === 0 ? 'FAILURE' : i < 100 ? 'SUCCESS' : 'RUNNING'
          )
        );

      return {
        graph,
        stages: stageMeta,
        builds: done,
        start: '~commit',
        collapsedStages: new Set(),
        minimap: true
      };
    }
    default:
      return { graph: COMPLEX_GRAPH };
  }
}
