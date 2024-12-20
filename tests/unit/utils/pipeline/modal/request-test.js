import { module, test } from 'qunit';
import { buildPostBody } from 'screwdriver-ui/utils/pipeline/modal/request';

module('Unit | Utility | pipeline/modal/request', function () {
  test('buildPostBody sets correct values for new event', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, null, null, null, false, null),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~commit'
      }
    );
  });

  test('buildPostBody sets correct values for group event starting from job', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, { name: 'job' }, null, null, false, null),
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
        null
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

  test('buildPostBody sets parameters', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, null, null, { param: 4 }, false, null),
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
      buildPostBody('foobar', 123, null, null, null, true, 'testing'),
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
        { id: 9, groupEventId: 2 },
        null,
        false,
        null,
        5
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
});
