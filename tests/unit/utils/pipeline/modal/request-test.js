import { module, test } from 'qunit';
import buildPostBody from 'screwdriver-ui/utils/pipeline/modal/request';

const COMMIT_SHA = 'b5bed0b64e2e9ec8a9970b8d070df7570376c498';

module('Unit | Utility | pipeline/modal/request', function () {
  test('buildPostBody sets correct values for new event', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: null,
        event: null,
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: null,
        prNum: null
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~commit'
      }
    );
  });

  test('buildPostBody sets correct values for new event starting from a job', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: { name: 'job' },
        event: null,
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: null
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'job'
      }
    );
  });

  test('buildPostBody sets correct values for new grouped event starting from job', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: {
          name: 'main'
        },
        event: {
          id: 987,
          groupEventId: 999
        },
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: COMMIT_SHA
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main',
        groupEventId: 999,
        parentEventId: 987
      }
    );
  });

  test('buildPostBody sets correct values for starting a new event from the specified sha', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: {
          name: 'main'
        },
        event: null,
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: COMMIT_SHA
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main',
        sha: COMMIT_SHA
      }
    );
  });

  test('buildPostBody sets parameters', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: null,
        event: null,
        parameters: { param: 4 },
        isFrozen: false,
        reason: null,
        sha: null
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~commit',
        meta: { parameters: { param: 4 } }
      }
    );
  });

  test('buildPostBody sets reason if frozen', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: null,
        event: null,
        parameters: null,
        isFrozen: true,
        reason: 'testing',
        sha: null
      }),
      {
        pipelineId: 123,
        causeMessage: '[force start]testing',
        startFrom: '~commit'
      }
    );
  });

  test('buildPostBody sets correct values for new PR event', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: null,
        event: {
          id: 9,
          groupEventId: 2,
          prNum: 5
        },
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: null,
        prNum: 5
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~pr',
        groupEventId: 2,
        parentEventId: 9,
        prNum: 5
      }
    );
  });

  test('buildPostBody sets correct values for starting from PR job', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: {
          name: 'job'
        },
        event: {
          id: 9,
          groupEventId: 2,
          prNum: 5
        },
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: null,
        prNum: 5
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'PR-5:job',
        groupEventId: 2,
        parentEventId: 9,
        prNum: 5
      }
    );
  });

  test('buildPostBody sets correct values for starting a new event from the specified sha', function (assert) {
    assert.deepEqual(
      buildPostBody({
        username: 'foobar',
        pipelineId: 123,
        job: {
          name: 'main'
        },
        event: null,
        parameters: null,
        isFrozen: false,
        reason: null,
        sha: COMMIT_SHA
      }),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main',
        sha: COMMIT_SHA
      }
    );
  });
});
