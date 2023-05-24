import { copy } from 'ember-copy';
import { assign } from '@ember/polyfills';

const events = [
  {
    id: '2',
    baseBranch: 'main',
    causeMessage: 'Merged by batman',
    commit: {
      message: 'Merge pull request #2 from batcave/batmobile',
      author: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
        url: 'https://github.com/adong'
      },
      url: 'https://github.com/adong/commit/abcdef1029384'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
      url: 'https://github.com/adong'
    },
    startFrom: '~commit',
    pipelineId: '4',
    groupEventId: '23452',
    sha: 'abcdef1029384',
    type: 'pipeline',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  },
  {
    id: '3',
    baseBranch: 'main',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix bug',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
        url: 'https://github.com/adong'
      },
      url: 'https://github.com/adong/commit/abcdef1029384'
    },
    createTime: '2016-11-05T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
      url: 'https://github.com/adong'
    },
    startFrom: '~pr',
    pr: {
      url: 'https://github.com/adong/batmobile/pulls/42'
    },
    pipelineId: '4',
    groupEventId: '23453',
    type: 'pr',
    prNum: 42,
    sha: '1029384bbb',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  },
  {
    id: '4',
    baseBranch: 'main',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix docs',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
        url: 'https://github.com/adong'
      },
      url: 'https://github.com/adong/batmobile/commit/1030384bbb'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'https://avatars.githubusercontent.com/u/15989893?v=4',
      url: 'https://github.com/adong'
    },
    startFrom: '~pr',
    pr: {
      url: 'https://github.com/adong/batmobile/pulls/43'
    },
    pipelineId: '4',
    groupEventId: '23454',
    sha: '1030384bbb',
    type: 'pr',
    prNum: 43,
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }
];

export default workflowGraph =>
  events.map(e => assign(copy(e, true), { workflowGraph }));
