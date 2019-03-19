import { copy } from '@ember/object/internals';
import { merge } from '@ember/polyfills';

const events = [
  {
    id: '2',
    causeMessage: 'Merged by batman',
    commit: {
      message: 'Merge pull request #2 from batcave/batmobile',
      author: {
        username: 'batman',
        name: 'Bruce W',
        avatar: 'http://example.com/u/batman/avatar',
        url: 'http://example.com/u/batman'
      },
      url: 'http://example.com/batcave/batmobile/commit/abcdef1029384'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'batman',
      name: 'Bruce W',
      avatar: 'http://example.com/u/batman/avatar',
      url: 'http://example.com/u/batman'
    },
    startFrom: '~commit',
    pipelineId: '12345',
    sha: 'abcdef1029384',
    type: 'pipeline',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }, {
    id: '3',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix bug',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'http://example.com/u/robin/avatar',
        url: 'http://example.com/u/robin'
      },
      url: 'http://example.com/batcave/batmobile/commit/1029384bbb'
    },
    createTime: '2016-11-05T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'http://example.com/u/robin/avatar',
      url: 'http://example.com/u/robin'
    },
    startFrom: '~pr',
    pr: {
      url: 'http://example.com/batcave/batmobile/pulls/42'
    },
    pipelineId: '12345',
    type: 'pr',
    prNum: 42,
    sha: '1029384bbb',
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }, {
    id: '4',
    causeMessage: 'Opened by github:robin',
    commit: {
      message: 'fix docs',
      author: {
        username: 'robin',
        name: 'Tim D',
        avatar: 'http://example.com/u/robin/avatar',
        url: 'http://example.com/u/robin'
      },
      url: 'http://example.com/batcave/batmobile/commit/1030384bbb'
    },
    createTime: '2016-11-04T20:09:41.238Z',
    creator: {
      username: 'robin',
      name: 'Tim D',
      avatar: 'http://example.com/u/robin/avatar',
      url: 'http://example.com/u/robin'
    },
    startFrom: '~pr',
    pr: {
      url: 'http://example.com/batcave/batmobile/pulls/43'
    },
    pipelineId: '12345',
    sha: '1030384bbb',
    type: 'pr',
    prNum: 43,
    workflowGraph: {
      nodes: [],
      edges: []
    }
  }
];

export default workflowGraph => events.map(e => merge(copy(e, true), { workflowGraph }));
