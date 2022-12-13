import { module, test } from 'qunit';
import EmberObject from '@ember/object';
import { Promise as EmberPromise } from 'rsvp';
import { copy } from 'ember-copy';
import {
  sortByName,
  sortByDuration,
  sortByLastRunStatus,
  sortByHistory,
  sortByLastRun
} from 'screwdriver-ui/utils/sort-functions';

const mockMetrics = [
  {
    id: 3,
    createTime: '2020-10-06T17:57:53.388Z',
    causeMessage: 'Manually started by klu909',
    sha: '9af92ba134322',
    commit: {
      message: '3',
      url: 'https://github.com/batman/foo/commit/9af92ba134322'
    },
    duration: 14,
    status: 'SUCCESS'
  },
  {
    id: 2,
    createTime: '2020-10-07T17:47:55.089Z',
    sha: '9af9234ba134321',
    commit: {
      message: '2',
      url: 'https://github.com/batman/foo/commit/9af92ba134321'
    },
    duration: 20,
    status: 'SUCCESS'
  },
  {
    id: 3,
    createTime: '2020-10-08T18:07:55.089Z',
    sha: '9af92c4ba134321',
    commit: {
      message: '2',
      url: 'https://github.com/batman/foo/commit/9af92ba134321'
    },
    duration: 30,
    status: 'ABORTED'
  },
  {
    id: 4,
    createTime: '2020-10-10T18:27:55.089Z',
    sha: '9af92c11ba134321',
    commit: {
      message: '2',
      url: 'https://github.com/batman/foo/commit/9af92ba134321'
    },
    duration: 50,
    status: 'ABORTED'
  }
];

const mockPipelines = copy([
  EmberObject.create({
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
    ],
    metrics: EmberPromise.resolve([mockMetrics[0]]),
    settings: {
      aliasName: 'screwdriver'
    },
    lastRunEvent: {
      duration: 14,
      status: 'success',
      createTime: '2020-10-06T17:57:53.388Z'
    },
    failedBuildCount: 5
  }),
  EmberObject.create({
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
    },
    lastBuilds: [
      {
        id: 123,
        status: 'SUCCESS',
        // Most recent build
        createTime: '2017-09-05T04:02:20.890Z'
      }
    ],
    metrics: EmberPromise.resolve([mockMetrics[1]]),
    settings: {
      aliasName: 'ui'
    },
    lastRunEvent: {
      duration: 50,
      status: 'aborted',
      createTime: '2020-10-07T17:47:55.089Z'
    },
    failedBuildCount: 8
  }),
  EmberObject.create({
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
    ],
    metrics: EmberPromise.resolve([mockMetrics[2]]),
    settings: {
      aliasName: 'models'
    },
    lastRunEvent: {
      duration: 20,
      status: 'success',
      createTime: '2020-10-08T18:07:55.089Z'
    },
    failedBuildCount: 10
  }),
  EmberObject.create({
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
    ],
    metrics: EmberPromise.resolve([mockMetrics[3]]),
    settings: {
      aliasName: 'zzz'
    },
    lastRunEvent: {
      duration: 30,
      status: 'aborted',
      createTime: '2020-10-10T18:27:55.089Z'
    },
    failedBuildCount: 1
  })
]);

const expectedPipelinesSortedByName = [
  'screwdriver-cd/models',
  'screwdriver-cd/screwdriver',
  'screwdriver-cd/ui',
  'screwdriver-cd/zzz'
];

const expectedPipelinesSortedByDuration = [14, 20, 30, 50];

const expectedPipelinesSortedByStatus = [
  'success',
  'success',
  'aborted',
  'aborted'
];

const expectedPipelinesSortedByHistory = [1, 5, 8, 10];

const expectedPipelinesSortedByLastRun = [
  '2020-10-06T17:57:53.388Z',
  '2020-10-07T17:47:55.089Z',
  '2020-10-08T18:07:55.089Z',
  '2020-10-10T18:27:55.089Z'
];

module('Unit | Utility | sort functions', function () {
  test('it sorts pipelines based upon names', function (assert) {
    const sortedPipelines = mockPipelines.sort(sortByName);
    const sortedPipelinesNames = sortedPipelines.map(_ => _.scmRepo.name);

    assert.deepEqual(sortedPipelinesNames, expectedPipelinesSortedByName);
  });

  test('it sorts pipelines based upon duration', function (assert) {
    const sortedPipelines = mockPipelines.sort(sortByDuration);
    const sortedPipelinesDuration = sortedPipelines.map(
      _ => _.lastRunEvent.duration
    );

    assert.deepEqual(
      sortedPipelinesDuration,
      expectedPipelinesSortedByDuration
    );
  });

  test('it sorts pipelines based upon status', function (assert) {
    const sortedPipelines = mockPipelines.sort(sortByLastRunStatus);
    const sortedPipelinesStatus = sortedPipelines.map(
      _ => _.lastRunEvent.status
    );

    assert.deepEqual(sortedPipelinesStatus, expectedPipelinesSortedByStatus);
  });

  test('it sorts pipelines based upon history', function (assert) {
    const sortedPipelines = mockPipelines.sort(sortByHistory);
    const sortedPipelinesHistory = sortedPipelines.map(_ => _.failedBuildCount);

    assert.deepEqual(sortedPipelinesHistory, expectedPipelinesSortedByHistory);
  });

  test('it sorts pipelines based upon last run', function (assert) {
    const sortedPipelines = mockPipelines.sort(sortByLastRun);
    const sortedPipelinesLastRun = sortedPipelines.map(
      _ => _.lastRunEvent.createTime
    );

    assert.deepEqual(sortedPipelinesLastRun, expectedPipelinesSortedByLastRun);
  });
});
