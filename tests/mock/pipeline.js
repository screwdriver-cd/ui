import { copy } from 'ember-copy';
import { assign } from '@ember/polyfills';
import { Promise as EmberPromise } from 'rsvp';

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

/**
 * return mock pipeline promise
 *
 * @returns promise
 */
export function mockPipelinesPromise() {
  return new EmberPromise(resolve =>
    resolve(
      copy(
        [
          {
            id: 1,
            scmUri: 'github.com:12345678:master',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main'],
            scmRepo: {
              name: 'screwdriver-cd/screwdriver',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
            },
            scmContext: 'github:github.com',
            annotations: {},
            lastEventId: 12,
            lastBuilds: [
              {
                id: 123,
                status: 'SUCCESS',
                // Most recent build
                createTime: '2017-09-05T04:02:20.890Z'
              }
            ]
          },
          {
            id: 2,
            scmUri: 'github.com:87654321:master',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main', 'publish'],
            scmRepo: {
              name: 'screwdriver-cd/ui',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/ui/tree/master'
            },
            scmContext: 'github:github.com',
            annotations: {},
            prs: {
              open: 2,
              failing: 1
            }
          },
          {
            id: 3,
            scmUri: 'github.com:54321876:master',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main'],
            scmRepo: {
              name: 'screwdriver-cd/models',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/models/tree/master'
            },
            scmContext: 'bitbucket:bitbucket.org',
            annotations: {},
            lastEventId: 23,
            lastBuilds: [
              {
                id: 125,
                status: 'FAILURE',
                // 2nd most recent build
                createTime: '2017-09-05T04:01:41.789Z'
              }
            ]
          },
          {
            id: 4,
            scmUri: 'github.com:54321879:master:lib',
            createTime: '2017-01-05T00:55:46.775Z',
            admins: {
              username: true
            },
            workflow: ['main'],
            scmRepo: {
              name: 'screwdriver-cd/zzz',
              branch: 'master',
              url: 'https://github.com/screwdriver-cd/zzz/tree/master',
              rootDir: 'lib'
            },
            scmContext: 'bitbucket:bitbucket.org',
            annotations: {},
            lastEventId: 23,
            lastBuilds: [
              {
                id: 125,
                status: 'UNSTABLE',
                createTime: '2017-09-05T04:01:41.789Z'
              }
            ]
          }
        ],
        true
      )
    )
  );
}
