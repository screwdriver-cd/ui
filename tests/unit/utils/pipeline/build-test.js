import { module, test } from 'qunit';
import {
  hasWarning,
  setBuildStatus
} from 'screwdriver-ui/utils/pipeline/build';

module('Unit | Utility | Pipeline | build', function () {
  test('hasWarning returns correct value', function (assert) {
    assert.equal(hasWarning(null), false);
    assert.equal(hasWarning({}), false);
    assert.equal(hasWarning({ meta: {} }), false);
    assert.equal(hasWarning({ meta: { build: {} } }), false);
    assert.equal(hasWarning({ meta: { build: { warning: false } } }), false);
    assert.equal(hasWarning({ meta: { build: { warning: true } } }), true);
    assert.equal(hasWarning({ meta: { build: { warning: {} } } }), false);
    assert.equal(
      hasWarning({ meta: { build: { warning: { message: '' } } } }),
      false
    );
    assert.equal(
      hasWarning({
        meta: { build: { warning: { message: 'This is a warning message' } } }
      }),
      true
    );
  });

  test('setBuildStatus sets correct values for builds', function (assert) {
    const builds = [
      { status: 'SUCCESS' },
      { status: 'FAILED' },
      { status: 'FAILED', meta: { build: { warning: 'No effect' } } },
      { status: 'SUCCESS', meta: { build: { warning: { message: '' } } } },
      {
        status: 'SUCCESS',
        meta: { build: { warning: { message: 'Changed status' } } }
      }
    ];

    builds.forEach(build => {
      setBuildStatus(build);
    });

    assert.equal(builds[0].status, 'SUCCESS');
    assert.equal(builds[1].status, 'FAILED');
    assert.equal(builds[2].status, 'FAILED');
    assert.equal(builds[3].status, 'SUCCESS');
    assert.equal(builds[4].status, 'WARNING');
  });
});
