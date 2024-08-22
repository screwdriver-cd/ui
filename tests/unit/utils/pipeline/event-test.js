import { module, test } from 'qunit';
import { isAborted, isSkipped } from 'screwdriver-ui/utils/pipeline/event';

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
});
