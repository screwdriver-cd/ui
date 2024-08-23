import { module, test } from 'qunit';
import { isComplete, isSkipped } from 'screwdriver-ui/utils/pipeline/event';

module('Unit | Utility | Pipeline | event', function () {
  test('isSkipped returns correct value', function (assert) {
    assert.equal(isSkipped({ type: 'pr' }), false);
    assert.equal(isSkipped({ type: 'pipeline' }), false);
    assert.equal(
      isSkipped({
        type: 'pipeline'
      }),
      false
    );
    assert.equal(
      isSkipped({
        type: 'pipeline',
        commit: { message: 'Made some changes' }
      }),
      false
    );
    assert.equal(
      isSkipped({
        type: 'pipeline',
        commit: { message: 'skip ci Made some changes' }
      }),
      false
    );
    assert.equal(
      isSkipped({
        type: 'pipeline',
        commit: { message: '[skip ci] Made some changes' }
      }),
      true
    );
    assert.equal(
      isSkipped({
        type: 'pipeline',
        commit: { message: '[ci skip] Made some changes' }
      }),
      true
    );
  });

  test('isComplete returns correct value', function (assert) {
    assert.equal(isComplete(null), true);
    assert.equal(isComplete([]), true);
    assert.equal(isComplete([{ status: 'UNSTABLE' }]), false);
    assert.equal(
      isComplete([{ status: 'UNSTABLE', endTime: '2024-04-01T00:00:00.000Z' }]),
      true
    );
    assert.equal(isComplete([{ status: 'SUCCESS' }]), true);
    assert.equal(isComplete([{ status: 'QUEUED' }]), false);
  });
});
