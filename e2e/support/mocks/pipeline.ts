// Mock API data, first copied from the Ember app's test fixtures so e2e does not depend on them.

export const INVALID_PIPELINE_ID = 0;
export const PARENT_PIPELINE_ID = 1;
export const CHILD_1_PIPELINE_ID = 2;
export const CHILD_2_PIPELINE_ID = 3;
export const PIPELINE_ID = 4;
export const PIPELINE_WITH_NO_EVENTS_ID = 5;

export const mockGraph = {
  nodes: [
    { name: '~pr' },
    { name: '~commit' },
    { id: 12345, name: 'main' },
    { id: 12346, name: 'publish' }
  ],
  edges: [
    { src: '~pr', dest: 'main' },
    { src: '~commit', dest: 'main' },
    { src: 'main', dest: 'publish' }
  ]
};

export const parentPipeline = {
  id: PARENT_PIPELINE_ID,
  scmUrl: 'git@github.com:foo/bar.git#master',
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  workflow: ['main', 'publish'],
  childPipelines: {
    scmUrls: ['git@github.com:child/one.git#master', 'git@github.com:child/two.git#master']
  },
  scmRepo: { name: 'foo/bar', branch: 'master', url: 'https://github.com/foo/bar' },
  annotations: {}
};

export const childPipeline1 = {
  id: CHILD_1_PIPELINE_ID,
  scmUrl: 'git@github.com:child/one.git#master',
  scmRepo: { name: 'child/one', branch: 'master', url: 'https://github.com/child/one' },
  state: 'ACTIVE'
};

export const childPipeline2 = {
  id: CHILD_2_PIPELINE_ID,
  scmUrl: 'git@github.com:child/two.git#master',
  scmRepo: { name: 'child/two', branch: 'master', url: 'https://github.com/child/two' },
  state: 'INACTIVE'
};

export const pipeline = {
  id: PIPELINE_ID,
  scmUrl: 'git@github.com:foo/bar.git#master',
  scmUri: 'github.com:84604643:master',
  scmContext: 'github:github.com',
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'master', url: 'https://github.com/foo/bar' },
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  annotations: {},
  workflowGraph: mockGraph
};

const job = (id: number, name: string) => ({
  id,
  name,
  pipelineId: PIPELINE_ID,
  state: 'ENABLED',
  archived: false,
  permutations: [{ annotations: {} }]
});

export const mockJobs = [
  job(12345, 'main'),
  job(12346, 'publish'),
  job(12347, 'PR-42:main'),
  job(12348, 'PR-42:publish'),
  job(12349, 'PR-43:main')
];
