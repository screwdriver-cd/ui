import { copy } from '@ember/object/internals';
import { assign } from '@ember/polyfills';

export const pipeline = {
  id: '4',
  scmUrl: 'git@github.com:foo/bar.git#master',
  scmRepo: {
    name: 'foo/bar',
    branch: 'master',
    url: 'https://github.com/foo/bar'
  },
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  workflowGraph: {
    nodes: [],
    edges: []
  }
};

const mockPipelines = [
  {
    admins: {
      adong: true
    },
    annotations: {},
    createTime: '2019-06-14T17:56:38.445Z',
    id: 1,
    name: 'screwdriver-cd/ui',
    prChain: false,
    scmContext: 'github:github.com',
    scmRepo: {
      branch: 'master',
      name: 'screwdriver-cd/ui',
      rootDir: '',
      url: 'https://github.com/screwdriver-cd/ui/tree/master'
    },
    scmUri: 'github.com:64884594:master',
    workflowGraph: {
      edges: [
        {
          dest: 'main',
          src: '~pr'
        },
        {
          dest: 'main',
          src: '~commit'
        },
        {
          dest: 'publish',
          src: 'main'
        },
        {
          dest: 'beta',
          src: 'publish'
        },
        {
          dest: 'prod',
          src: 'beta'
        }
      ],
      nodes: [
        {
          name: '~pr'
        },
        {
          name: '~commit'
        },
        {
          id: 1,
          name: 'main'
        },
        {
          id: 2,
          name: 'publish'
        },
        {
          id: 3,
          name: 'beta'
        },
        {
          id: 4,
          name: 'prod'
        }
      ]
    }
  }
];

export const hasPipelines = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockPipelines)
];

export default workflowGraph => assign(copy(pipeline, true), { workflowGraph });
