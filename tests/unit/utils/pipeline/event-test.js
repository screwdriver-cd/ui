import { module, test } from 'qunit';
import { isAborted, isSkipped } from 'screwdriver-ui/utils/pipeline/event';

module('Unit | Utility | Pipeline | event', function () {
  test('pr events are not skipped', function (assert) {
    assert.equal(isSkipped({ type: 'pr' }, []), false);
  });

  test('pipeline events with builds are not skipped', function (assert) {
    assert.equal(
      isSkipped(
        {
          type: 'pipeline'
        },
        [{ id: 1 }]
      ),
      false
    );
  });

  test('pipeline events without skip trigger in commit messages are not skipped', function (assert) {
    assert.equal(
      isSkipped(
        {
          type: 'pipeline',
          commit: { message: 'Made some changes' }
        },
        []
      ),
      false
    );
    assert.equal(
      isSkipped(
        {
          type: 'pipeline',
          commit: { message: 'skip ci Made some changes' }
        },
        []
      ),
      false
    );
  });

  test('pipeline events with skip trigger in commit messages are skipped', function (assert) {
    assert.equal(
      isSkipped(
        {
          type: 'pipeline',
          commit: { message: '[skip ci] Made some changes' }
        },
        []
      ),
      true
    );
    assert.equal(
      isSkipped(
        {
          type: 'pipeline',
          commit: { message: '[ci skip] Made some changes' }
        },
        []
      ),
      true
    );
  });

  test('isAborted returns correct value', function (assert) {
    assert.equal(isAborted(null), false);
    assert.equal(isAborted([]), false);
    assert.equal(isAborted([{ status: 'ABORTED' }]), true);
    assert.equal(
      isAborted([{ status: 'CREATED' }, { status: 'ABORTED' }]),
      false
    );
  });
});
