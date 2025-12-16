import { module, test } from 'qunit';
import {
  buildPostBody,
  capitalizeFirstLetter,
  isParameterized,
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

  test('isParameterized returns true if pipeline or event has parameters', function (assert) {
    assert.equal(isParameterized({}, {}), false);
    assert.equal(isParameterized({ parameters: { a: 4 } }, {}), true);
    assert.equal(isParameterized({}, { meta: {} }), false);
    assert.equal(
      isParameterized({}, { meta: { parameters: { p1: { value: 'foo' } } } }),
      true
    );
    assert.equal(
      isParameterized(
        { parameters: { a: 4 } },
        { meta: { parameters: { p1: { value: 'foo' } } } }
      ),
      true
    );
  });

  test('buildPostBody sets correct values for new event', function (assert) {
    const jobName = '~commit';

    assert.deepEqual(buildPostBody(jobName, null, null, null, null), {
      startFrom: jobName
    });
  });

  test('buildPostBody sets correct values for new event in event group', function (assert) {
    const jobName = '~commit';
    const event = {
      id: 4,
      groupEventId: 2
    };

    assert.deepEqual(buildPostBody(jobName, event, null, null, null), {
      startFrom: jobName,
      parentEventId: event.id,
      groupEventId: event.groupEventId
    });
  });

  test('buildPostBody sets correct values for new event from specific sha', function (assert) {
    const jobName = '~commit';
    const sha = 'abc123';

    assert.deepEqual(buildPostBody(jobName, null, sha), {
      startFrom: jobName,
      sha
    });
  });

  test('buildPostBody sets correct values for new PR event', function (assert) {
    const jobName = '~pr';
    const event = {
      id: 45,
      groupEventId: 10
    };
    const prNum = 7;

    assert.deepEqual(buildPostBody(jobName, event, null, prNum), {
      prNum,
      startFrom: jobName,
      parentEventId: event.id,
      groupEventId: event.groupEventId
    });
  });

  test('buildPostBody sets correct values for new PR event from specified job', function (assert) {
    const jobName = 'pull';
    const event = {
      id: 45,
      groupEventId: 10
    };
    const prNum = 7;

    assert.deepEqual(buildPostBody(jobName, event, null, prNum), {
      prNum,
      startFrom: `PR-${prNum}:${jobName}`,
      parentEventId: event.id,
      groupEventId: event.groupEventId
    });
  });

  test('buildPostBody sets correct values for new PR event from specified job with PR prefix', function (assert) {
    const prNum = 7;
    const jobName = `PR-${prNum}:pull`;
    const event = {
      id: 45,
      groupEventId: 10
    };

    assert.deepEqual(buildPostBody(jobName, event, null, prNum), {
      prNum,
      startFrom: jobName,
      parentEventId: event.id,
      groupEventId: event.groupEventId
    });
  });

  test('buildPostBody sets correct values for new event with parameters', function (assert) {
    const jobName = '~commit';
    const parameters = { param: 4 };

    assert.deepEqual(buildPostBody(jobName, null, null, null, parameters), {
      startFrom: jobName,
      meta: {
        parameters
      }
    });
  });
});
