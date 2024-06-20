import { module, test } from 'qunit';
import {
  flattenJobParameters,
  flattenParameters,
  flattenParameterGroup
} from 'screwdriver-ui/components/pipeline/parameters/util';

module('Unit | Component | pipeline/parameters/util', function () {
  test('flattenParameterGroup flattens correctly', function (assert) {
    assert.deepEqual(flattenParameterGroup({ param: { value: 123 } }), {
      param: 123
    });

    assert.deepEqual(
      flattenParameterGroup({
        param1: { value: 123 },
        param2: { value: 'abc' }
      }),
      {
        param1: 123,
        param2: 'abc'
      }
    );
  });

  test('flattenJobParameters flattens correctly', function (assert) {
    assert.deepEqual(
      flattenJobParameters({
        job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } },
        job2: { p1: { value: 123 }, p2: { value: 987 } }
      }),
      { job1: { p1: 'abc', p2: 'xyz' }, job2: { p1: 123, p2: 987 } }
    );
  });

  test('flattenParameters flattens correctly', function (assert) {
    assert.deepEqual(
      flattenParameters({
        pipeline: { p1: { value: 'pipeline' }, p2: { value: 'pipeline2' } }
      }),
      { p1: 'pipeline', p2: 'pipeline2' }
    );

    assert.deepEqual(
      flattenParameters({
        job: { main: { j1: { value: 123 }, j2: { value: 'abc' } } }
      }),
      { main: { j1: 123, j2: 'abc' } }
    );

    assert.deepEqual(
      flattenParameters({
        pipeline: {
          p1: { value: 'pipeline' },
          p2: { value: 'pipeline2' }
        },
        job: {
          main: {
            j1: { value: 123 },
            j2: { value: 'abc' }
          },
          secondary: {
            j1: { value: 'xyz' },
            j2: { value: 987 }
          }
        }
      }),
      {
        p1: 'pipeline',
        p2: 'pipeline2',
        main: { j1: 123, j2: 'abc' },
        secondary: { j1: 'xyz', j2: 987 }
      }
    );
  });
});
