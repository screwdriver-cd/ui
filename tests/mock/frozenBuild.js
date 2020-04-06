const frozenBuild = {
  buildId: null,
  causeMessage: 'Manually started by adong',
  commit: {
    author: {
      avatar: 'https://avatars3.githubusercontent.com/u/15989893?v=4',
      name: 'Alan',
      username: 'adong',
      url: 'https://github.com/adong'
    },
    committer: {
      avatar: 'https://avatars3.githubusercontent.com/u/19864447?v=4',
      name: 'GitHub Web Flow',
      username: 'web-flow',
      url: 'https://github.com/web-flow'
    },
    message: 'Change freezeWindow from nov(11) to dec(12)',
    url: 'https://github.com/adong/sd-dummy-job/commit/28fe2cc0b60fde5880c4dc838e4b83ab45aac91f'
  },
  createTime: '2019-12-03T00:30:37.043Z',
  creator: {
    avatar: 'https://avatars3.githubusercontent.com/u/15989893?v=4',
    name: 'Alan',
    username: 'adong',
    url: 'https://github.com/adong'
  },
  isComplete: true,
  meta: {
    parameters: {
      p1: {
        value: 'p1'
      }
    }
  },
  numBuilds: 1,
  reloadWithoutNewBuilds: 11,
  parentBuildId: null,
  parentEventId: 50,
  pipelineId: '1',
  pr: {},
  prNum: null,
  sha: '28fe2cc0b60fde5880c4dc838e4b83ab45aac91f',
  startFrom: 'mainFreeze',
  status: 'FROZEN',
  type: 'pipeline',
  workflowGraph: {
    nodes: [
      {
        name: '~pr'
      },
      {
        name: '~commit'
      },
      {
        id: 6,
        status: 'SUCCESS',
        name: 'main'
      },
      {
        id: 7,
        status: 'FROZEN',
        name: 'mainFreeze'
      }
    ],
    edges: [
      {
        src: '~pr',
        dest: 'main'
      },
      {
        src: '~commit',
        dest: 'main'
      },
      {
        src: 'main',
        dest: 'mainFreeze'
      }
    ]
  },
  builds: []
};

export { frozenBuild as default };
