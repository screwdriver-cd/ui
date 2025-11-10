import { mockGraph } from './workflow-graph';

export const INVALID_PIPELINE_ID = 0;
export const PARENT_PIPELINE_ID = 1;
export const CHILD_1_PIPELINE_ID = 2;
export const CHILD_2_PIPELINE_ID = 3;
export const PIPELINE_ID = 4;
export const PIPELINE_WITH_NO_EVENTS_ID = 5;

export const parentPipeline = {
  id: PARENT_PIPELINE_ID,
  scmUrl: 'git@github.com:foo/bar.git#master',
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  workflow: ['main', 'publish'],
  childPipelines: {
    scmUrls: [
      'git@github.com:child/one.git#master',
      'git@github.com:child/two.git#master'
    ]
  },
  scmRepo: {
    name: 'foo/bar',
    branch: 'master',
    url: 'https://github.com/foo/bar'
  },
  annotations: {}
};

export const childPipeline1 = {
  id: CHILD_1_PIPELINE_ID,
  scmUrl: 'git@github.com:child/one.git#master',
  scmRepo: {
    name: 'child/one',
    branch: 'master',
    url: 'https://github.com/child/one'
  },
  state: 'ACTIVE'
};

export const childPipeline2 = {
  id: CHILD_2_PIPELINE_ID,
  scmUrl: 'git@github.com:child/two.git#master',
  scmRepo: {
    name: 'child/two',
    branch: 'master',
    url: 'https://github.com/child/two'
  },
  state: 'INACTIVE'
};

export const pipeline = {
  id: PIPELINE_ID,
  scmUrl: 'git@github.com:foo/bar.git#master',
  scmUri: 'github.com:84604643:master',
  scmContext: 'github:github.com',
  name: 'foo/bar',
  scmRepo: {
    name: 'foo/bar',
    branch: 'master',
    url: 'https://github.com/foo/bar'
  },
  createTime: '2016-09-15T23:12:23.760Z',
  admins: { batman: true },
  annotations: {},
  workflowGraph: mockGraph
};
