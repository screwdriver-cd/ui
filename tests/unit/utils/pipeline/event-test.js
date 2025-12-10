import { module, test } from 'qunit';
import {
  getStatus,
  isComplete,
  isSkipped
} from 'screwdriver-ui/utils/pipeline/event';

module('Unit | Utility | Pipeline | event', function () {
  test('isSkipped returns correct value', function (assert) {
    const builds = [{ id: 123 }];

    assert.equal(isSkipped({ type: 'pr' }), false);
    assert.equal(isSkipped({ type: 'pr' }, []), false);
    assert.equal(isSkipped({ type: 'pr' }, builds), false);
    assert.equal(isSkipped({ type: 'pipeline' }, builds), false);
    assert.equal(isSkipped({ type: 'pipeline' }), false);
    assert.equal(isSkipped({ type: 'pipeline' }, []), false);
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
    assert.equal(isComplete(null, []), false);
    assert.equal(isComplete([], []), false);
    assert.equal(isComplete([{ id: 1, status: 'QUEUED' }], []), false);
    assert.equal(isComplete([{ id: 1, status: 'CREATED' }], []), false);
    assert.equal(isComplete([{ id: 1, status: 'SUCCESS' }], []), true);
    assert.equal(isComplete([{ id: 1, status: 'UNSTABLE' }], []), false);
    assert.equal(
      isComplete(
        [{ id: 1, status: 'UNSTABLE', endTime: '2024-04-01T00:00:00.000Z' }],
        []
      ),
      true
    );
    assert.equal(
      isComplete(
        [{ id: 1, status: 'RUNNING' }],
        [{ id: 1, status: 'CREATED' }]
      ),
      false
    );
    assert.equal(
      isComplete(
        [{ id: 1, status: 'SUCCESS' }],
        [{ id: 1, status: 'CREATED' }]
      ),
      true
    );
    assert.equal(
      isComplete(
        [
          { id: 1, status: 'RUNNING' },
          { id: 2, status: 'CREATED' }
        ],
        [{ id: 1, status: 'CREATED' }]
      ),
      false
    );
    assert.equal(
      isComplete(
        [
          { id: 1, status: 'SUCCESS' },
          { id: 2, status: 'CREATED' }
        ],
        [{ id: 1, status: 'CREATED' }]
      ),
      false
    );
    assert.equal(
      isComplete(
        [
          { id: 1, status: 'RUNNING' },
          { id: 2, status: 'CREATED' }
        ],
        [
          { id: 1, status: 'RUNNING' },
          { id: 2, status: 'CREATED' }
        ]
      ),
      false
    );
    assert.equal(
      isComplete(
        [
          { id: 1, status: 'SUCCESS' },
          { id: 2, status: 'CREATED' }
        ],
        [
          { id: 1, status: 'SUCCESS' },
          { id: 2, status: 'CREATED' }
        ]
      ),
      true
    );
  });

  test('getStatus returns correct value', function (assert) {
    assert.equal(getStatus([], true, false), 'SKIPPED');
    assert.equal(getStatus([], true, true), 'SKIPPED');
    assert.equal(getStatus(null, false, false), 'UNKNOWN');
    assert.equal(getStatus([], false, false), 'UNKNOWN');
    assert.equal(getStatus([{ status: 'FROZEN' }], false, false), 'FROZEN');
    assert.equal(getStatus([{ status: 'SUCCESS' }], false, false), 'RUNNING');
    assert.equal(getStatus([{ status: 'CREATED' }], false, true), 'RUNNING');
    assert.equal(getStatus([{ status: 'SUCCESS' }], false, true), 'SUCCESS');
    assert.equal(getStatus([{ status: 'WARNING' }], false, true), 'WARNING');
  });
});
