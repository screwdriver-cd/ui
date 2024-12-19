import build from 'screwdriver-ui/utils/build';
import { module, test } from 'qunit';
const { isActiveBuild, isPRJob, statusIcon } = build;

module('Unit | Utility | build', function () {
  test('it checks if the current build is active', assert => {
    let result = isActiveBuild('QUEUED', '2017-01-05T00:55:46.775Z');

    assert.ok(result);

    result = isActiveBuild('RUNNING', '2017-01-05T00:55:46.775Z');
    assert.ok(result);

    result = isActiveBuild('BLOCKED', '2017-01-05T00:55:46.775Z');
    assert.ok(result);

    result = isActiveBuild('UNSTABLE');
    assert.ok(result);

    result = isActiveBuild('UNSTABLE', '2017-01-05T00:55:46.775Z');
    assert.notOk(result);

    result = isActiveBuild('CREATED');
    assert.notOk(result);
  });

  test('it checks if the current job is a PR job', assert => {
    let result = isPRJob('main');

    assert.notOk(result);

    result = isPRJob('PR-1:main');
    assert.ok(result);
  });

  test('it gets the right fs class name for given status', assert => {
    const successLight = {
      flip: false,
      name: 'circle-check',
      prefix: 'far',
      spin: false
    };
    const success = {
      flip: false,
      name: 'circle-check',
      prefix: 'fas',
      spin: false
    };
    const spinner = {
      flip: false,
      name: 'spinner',
      prefix: 'fa',
      spin: true
    };
    const unstable = {
      flip: false,
      name: 'circle-exclamation',
      prefix: 'fa',
      spin: false
    };
    const failureLight = {
      flip: false,
      name: 'circle-xmark',
      prefix: 'far',
      spin: false
    };
    const failure = {
      flip: false,
      name: 'circle-xmark',
      prefix: 'fas',
      spin: false
    };
    const defaultIcon = {
      flip: false,
      name: 'circle',
      prefix: 'far',
      spin: false
    };

    assert.deepEqual(statusIcon('SUCCESS', true), successLight);
    assert.deepEqual(statusIcon('SUCCESS'), success);
    assert.deepEqual(statusIcon('CREATED', true), successLight);
    assert.deepEqual(statusIcon('CREATED'), success);
    assert.deepEqual(statusIcon('RUNNING'), spinner);
    assert.deepEqual(statusIcon('QUEUED'), spinner);
    assert.deepEqual(statusIcon('UNSTABLE'), unstable);
    assert.deepEqual(statusIcon('FAILURE', true), failureLight);
    assert.deepEqual(statusIcon('FAILURE'), failure);
    assert.deepEqual(statusIcon(), defaultIcon);
  });
});
