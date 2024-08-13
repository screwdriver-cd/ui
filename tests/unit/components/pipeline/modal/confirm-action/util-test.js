import { module, test } from 'qunit';
import {
  buildPostBody,
  capitalizeFirstLetter,
  truncateMessage
} from 'screwdriver-ui/components/pipeline/modal/confirm-action/util';

module('Unit | Component | pipeline/modal/confirm-action/util', function () {
  test('truncateMessage truncates string', function (assert) {
    const shortMessage = 'short message';

    assert.equal(truncateMessage(shortMessage), shortMessage);

    const longMessage =
      'This commit message is really long and will exceed the expected character length; as such, it will be truncated in order to fit within the expected character length';

    assert.equal(
      truncateMessage(longMessage),
      'This commit message is really long and will exceed the expected character length; as such, it will be truncated in order to fit within the expected ch...'
    );
  });

  test('capitalizeFirstLetter capitalizes first letter of string', function (assert) {
    assert.equal(capitalizeFirstLetter('foo'), 'Foo');
  });

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
