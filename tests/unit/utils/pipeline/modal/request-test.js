import { module, test } from 'qunit';
import { buildPostBody } from 'screwdriver-ui/utils/pipeline/modal/request';

const COMMIT_SHA = 'b5bed0b64e2e9ec8a9970b8d070df7570376c498';

module('Unit | Utility | pipeline/modal/request', function () {
  test('buildPostBody sets correct values for new event', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, null, null, null, false, null, null),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~commit'
      }
    );
  });

  test('buildPostBody sets correct values for new event starting from a job', function (assert) {
    assert.deepEqual(
      buildPostBody(
        'foobar',
        123,
        { name: 'job' },
        null,
        null,
        false,
        null,
        null
      ),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'job'
      }
    );
  });

  test('buildPostBody sets correct values for new grouped event starting from job', function (assert) {
    assert.deepEqual(
      buildPostBody(
        'foobar',
        123,
        { name: 'main' },
        { id: 987, groupEventId: 999 },
        null,
        false,
        null,
        COMMIT_SHA
      ),
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
      buildPostBody(
        'foobar',
        123,
        { name: 'main' },
        null,
        null,
        false,
        null,
        COMMIT_SHA
      ),
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
      buildPostBody('foobar', 123, null, null, { param: 4 }, false, null, null),
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
      buildPostBody('foobar', 123, null, null, null, true, 'testing', null),
      {
        pipelineId: 123,
        causeMessage: '[force start]testing',
        startFrom: '~commit'
      }
    );
  });

  test('buildPostBody sets correct values for new PR event', function (assert) {
    assert.deepEqual(
      buildPostBody(
        'foobar',
        123,
        null,
        { id: 9, groupEventId: 2, prNum: 5 },
        null,
        false,
        null,
        null
      ),
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
      buildPostBody(
        'foobar',
        123,
        { name: 'job' },
        { id: 9, groupEventId: 2, prNum: 5 },
        null,
        false,
        null,
        null
      ),
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
      buildPostBody(
        'foobar',
        123,
        { name: 'main' },
        null,
        null,
        false,
        null,
        COMMIT_SHA
      ),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main',
        sha: COMMIT_SHA
      }
    );
  });
});
