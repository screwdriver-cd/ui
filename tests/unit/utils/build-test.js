import build from 'screwdriver-ui/utils/build';
import { module, test } from 'qunit';
const { isActiveBuild, isPRJob, statusIcon } = build;

module('Unit | Utility | build', function() {
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
    assert.equal(statusIcon('SUCCESS', true), 'check-circle-o');
    assert.equal(statusIcon('SUCCESS'), 'check-circle');
    assert.equal(statusIcon('CREATED', true), 'check-circle-o');
    assert.equal(statusIcon('CREATED'), 'check-circle');
    assert.equal(statusIcon('RUNNING'), 'spinner fa-spin');
    assert.equal(statusIcon('QUEUED'), 'spinner fa-spin');
    assert.equal(statusIcon('UNSTABLE'), 'exclamation-circle');
    assert.equal(statusIcon('FAILURE', true), 'times-circle-o');
    assert.equal(statusIcon('FAILURE'), 'times-circle');
    assert.equal(statusIcon(), 'circle-o');
  });
});
