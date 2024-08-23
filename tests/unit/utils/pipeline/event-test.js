import { module, test } from 'qunit';
import {
  areAllBuildsComplete,
  hasBuildsToComplete,
  isAborted,
  isSkipped
} from 'screwdriver-ui/utils/pipeline/event';

module('Unit | Utility | Pipeline | event', function () {
  test('isSkipped returns correct value', function (assert) {
    assert.equal(isSkipped({ type: 'pr' }, []), false);
    assert.equal(isSkipped({ type: 'pipeline' }, null), false);
    assert.equal(isSkipped({ type: 'pipeline' }, []), false);
    assert.equal(
      isSkipped(
        {
          type: 'pipeline'
        },
        [{ id: 1 }]
      ),
      false
    );
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

  test('hasBuildsToComplete returns correct value', function (assert) {
    assert.equal(hasBuildsToComplete(null), false);
    assert.equal(hasBuildsToComplete([]), false);
    assert.equal(hasBuildsToComplete([{ status: 'SUCCESS' }]), false);
    assert.equal(hasBuildsToComplete([{ status: 'QUEUED' }]), true);
    assert.equal(hasBuildsToComplete([{ status: 'UNSTABLE' }]), true);
    assert.equal(
      hasBuildsToComplete([
        { status: 'UNSTABLE', endTime: '2024-04-01T00:00:00.000Z' }
      ]),
      false
    );
  });

  test('areAllBuildsComplete returns correct value', function (assert) {
    assert.equal(areAllBuildsComplete(null), true);
    assert.equal(areAllBuildsComplete([]), true);
    assert.equal(areAllBuildsComplete([{ status: 'UNSTABLE' }]), false);
    assert.equal(
      areAllBuildsComplete([
        { status: 'UNSTABLE', endTime: '2024-04-01T00:00:00.000Z' }
      ]),
      true
    );
    assert.equal(areAllBuildsComplete([{ status: 'QUEUED' }]), false);
    assert.equal(areAllBuildsComplete([{ status: 'SUCCESS' }]), true);
  });
});
