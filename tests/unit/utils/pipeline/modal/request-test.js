import { module, test } from 'qunit';
import { buildPostBody } from 'screwdriver-ui/utils/pipeline/modal/request';

module('Unit | Utility | pipeline/modal/request', function () {
  test('buildPostBody sets core values', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, {}, null, null, false, null),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: '~commit'
      }
    );
  });

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

  test('buildPostBody sets correct values for new event starting from job', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, { name: 'main' }, null, null, false, null),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main'
      }
    );
  });

  test('buildPostBody sets correct values for restart', function (assert) {
    assert.deepEqual(
      buildPostBody(
        'foobar',
        123,
        { name: 'main', status: 'SUCCESS' },
        { id: 999, groupEventId: 54321 },
        null,
        false,
        null
      ),
      {
        pipelineId: 123,
        causeMessage: 'Manually started by foobar',
        startFrom: 'main',
        groupEventId: 54321,
        parentEventId: 999
      }
    );
  });

  test('buildPostBody sets parameters', function (assert) {
    assert.deepEqual(
      buildPostBody('foobar', 123, {}, null, { param: 4 }, false, null),
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
      buildPostBody('foobar', 123, {}, null, null, true, 'testing'),
      {
        pipelineId: 123,
        causeMessage: '[force start]testing',
        startFrom: '~commit'
      }
    );
  });
});
