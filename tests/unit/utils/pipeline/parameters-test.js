import { module, test } from 'qunit';
import {
  extractDefaultJobParameters,
  extractDefaultParameters,
  extractEventParameters,
  extractJobParameters,
  flattenJobParameters,
  flattenParameters,
  flattenParameterGroup,
  getNormalizedParameterGroups,
  isPipelineParameter,
  normalizeParameters
} from 'screwdriver-ui/utils/pipeline/parameters';

module('Unit | Utility | Pipeline | parameters', function () {
  test('isPipelineParameter', function (assert) {
    assert.equal(isPipelineParameter({}), false);
    assert.equal(isPipelineParameter({ value: 'abc' }), true);
    assert.equal(isPipelineParameter({ value: 'abc', default: false }), true);
    assert.equal(isPipelineParameter({ p1: { value: 'abc' } }), false);
  });

  test('extractEventParameters extracts parameters from event object', function (assert) {
    const parameters = extractEventParameters({
      meta: {
        parameters: {
          foo: { value: 'bar' },
          job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
        }
      }
    });

    assert.deepEqual(parameters.pipelineParameters, { foo: { value: 'bar' } });
    assert.deepEqual(parameters.jobParameters, {
      job1: { p1: { value: 'abc' }, p2: { value: 'xyz' } }
    });
  });

  test('extractEventParameters returns empty objects when no parameters are provided', function (assert) {
    const parameters = extractEventParameters({
      meta: {}
    });

    assert.deepEqual(parameters.pipelineParameters, {});
    assert.deepEqual(parameters.jobParameters, {});
  });

  test('extractJobParameters extracts job parameters from jobs response object', function (assert) {
    const parameters = extractJobParameters([
      { name: 'job1', permutations: [{ parameters: { a: 1, b: 'abc123' } }] },
      {
        name: 'job2',
        permutations: [
          {
            parameters: {
              c: { description: 'cool stuff', value: true },
              d: ['yes', 'no']
            }
          }
        ]
      },
      {
        name: 'job3',
        permutations: []
      }
    ]);

    assert.deepEqual(parameters, {
      job1: { a: 1, b: 'abc123' },
      job2: {
        c: { description: 'cool stuff', value: true },
        d: ['yes', 'no']
      }
    });
  });

  test('extractJobParameters returns empty object when no jobs are provided', function (assert) {
    const parameters = extractJobParameters([]);

    assert.deepEqual(parameters, {});
  });

  test('extractDefaultParameters returns empty object if no parameters are provided', function (assert) {
    assert.deepEqual(extractDefaultParameters(undefined), {});
    assert.deepEqual(extractDefaultParameters(null), {});
    assert.deepEqual(extractDefaultParameters({}), {});
  });

  test('extractDefaultParameters extracts default parameters', function (assert) {
    const parameters = extractDefaultParameters({
      list: ['123', '987'],
      foo: 'bar',
      abc: { value: 123, desc: 'abc description' },
      xyz: { value: [987, 321], desc: 'xyz description' }
    });

    assert.deepEqual(parameters, {
      list: { value: '123' },
      foo: { value: 'bar' },
      abc: { value: 123 },
      xyz: { value: 987 }
    });
  });

  test('extractDefaultJobParameters returns empty object when no jobs are provided', function (assert) {
    assert.deepEqual(extractDefaultJobParameters(undefined), {});
    assert.deepEqual(extractDefaultJobParameters(null), {});
    assert.deepEqual(extractDefaultJobParameters([]), {});
  });

  test('extractDefaultJobParameters extracts default parameters from jobs response object', function (assert) {
    const parameters = extractDefaultJobParameters([
      {
        name: 'job1',
        permutations: [
          {
            parameters: {
              a: 1,
              b: 'abc123'
            }
          }
        ]
      },
      {
        name: 'job2',
        permutations: [
          {
            parameters: {
              c: { description: 'cool stuff', value: true },
              d: ['yes', 'no']
            }
          }
        ]
      }
    ]);

    assert.deepEqual(parameters, {
      job1: {
        a: { value: 1 },
        b: { value: 'abc123' }
      },
      job2: {
        c: { value: true },
        d: { value: 'yes' }
      }
    });
  });

  test('extractDefaultJobParameters returns empty object when jobs have no parameters', function (assert) {
    const parameters = extractDefaultJobParameters([
      {
        name: 'job1',
        permutations: [{}]
      }
    ]);

    assert.deepEqual(parameters, {});
  });

  test('normalizeParameters returns normalized parameters', function (assert) {
    const parameters = normalizeParameters({
      param1: true,
      param2: 'abc',
      param3: { value: 'something', description: 'some description' }
    });

    assert.equal(parameters.length, 3);
    assert.deepEqual(parameters[0], {
      name: 'param1',
      value: true,
      defaultValues: true,
      description: ''
    });
    assert.deepEqual(parameters[1], {
      name: 'param2',
      value: 'abc',
      defaultValues: 'abc',
      description: ''
    });
    assert.deepEqual(parameters[2], {
      name: 'param3',
      value: 'something',
      defaultValues: 'something',
      description: 'some description'
    });
  });

  test('normalizeParameters returns normalized parameters with default parameters', function (assert) {
    const parameters = normalizeParameters(
      {
        param1: true,
        param2: 'abc',
        param3: { value: 'something', description: 'some description' },
        param4: { value: 'foo' }
      },
      {
        param1: false,
        param2: { value: 'xyz', description: 'param description' },
        param3: { value: 'default value' },
        param4: { value: ['foo', 'bar', 'baz'] }
      }
    );

    assert.equal(parameters.length, 4);
    assert.deepEqual(parameters[0], {
      name: 'param1',
      value: true,
      defaultValues: false,
      description: ''
    });
    assert.deepEqual(parameters[1], {
      name: 'param2',
      value: 'abc',
      defaultValues: 'xyz',
      description: 'param description'
    });
    assert.deepEqual(parameters[2], {
      name: 'param3',
      value: 'something',
      defaultValues: 'default value',
      description: 'some description'
    });
    assert.deepEqual(parameters[3], {
      name: 'param4',
      value: 'foo',
      defaultValues: ['foo', 'bar', 'baz'],
      description: ''
    });
  });

  test('getNormalizedParameterGroups returns normalized parameter groups', function (assert) {
    const parameterGroups = getNormalizedParameterGroups(
      {
        pipelineParam1: { value: 'abc123', description: 'test' },
        pipelineParam2: 'abc'
      },
      { pipelineParam1: 'default123' },
      { job1: { a: true, b: { value: 'xyz' } }, job2: { j2: 123 } },
      { job1: { b: '123xyz' }, job2: { j2: 999 } }
    );

    assert.equal(parameterGroups.length, 3);
    assert.deepEqual(parameterGroups[0], {
      jobName: null,
      parameters: [
        {
          name: 'pipelineParam1',
          value: 'abc123',
          defaultValues: 'default123',
          description: 'test'
        },
        {
          name: 'pipelineParam2',
          value: 'abc',
          defaultValues: 'abc',
          description: ''
        }
      ],
      isOpen: true,
      paramGroupTitle: 'Shared'
    });
    assert.deepEqual(parameterGroups[1], {
      jobName: 'job1',
      parameters: [
        { name: 'a', value: true, defaultValues: true, description: '' },
        { name: 'b', value: 'xyz', defaultValues: '123xyz', description: '' }
      ],
      isOpen: false,
      paramGroupTitle: 'Job: job1'
    });
    assert.deepEqual(parameterGroups[2], {
      jobName: 'job2',
      parameters: [
        { name: 'j2', value: 123, defaultValues: 999, description: '' }
      ],
      isOpen: false,
      paramGroupTitle: 'Job: job2'
    });
  });

  test('getNormalizedParameterGroups returns normalized parameter groups with selected job as first item', function (assert) {
    const parameterGroups = getNormalizedParameterGroups(
      {
        pipelineParam1: { value: 'abc123', description: 'test' },
        pipelineParam2: 'abc'
      },
      { pipelineParam1: 'default123' },
      { job1: { a: true, b: { value: 'xyz' } }, job2: { j2: 123 } },
      { job1: { b: '123xyz' }, job2: { j2: 999 } },
      'job2'
    );

    assert.equal(parameterGroups.length, 3);
    assert.deepEqual(parameterGroups[0], {
      jobName: 'job2',
      parameters: [
        { name: 'j2', value: 123, defaultValues: 999, description: '' }
      ],
      isOpen: true,
      paramGroupTitle: 'Job: job2'
    });
    assert.deepEqual(parameterGroups[1], {
      jobName: null,
      parameters: [
        {
          name: 'pipelineParam1',
          value: 'abc123',
          defaultValues: 'default123',
          description: 'test'
        },
        {
          name: 'pipelineParam2',
          value: 'abc',
          defaultValues: 'abc',
          description: ''
        }
      ],
      isOpen: false,
      paramGroupTitle: 'Shared'
    });
    assert.deepEqual(parameterGroups[2], {
      jobName: 'job1',
      parameters: [
        { name: 'a', value: true, defaultValues: true, description: '' },
        { name: 'b', value: 'xyz', defaultValues: '123xyz', description: '' }
      ],
      isOpen: false,
      paramGroupTitle: 'Job: job1'
    });
  });

  test('getNormalizedParameterGroups returns normalized parameter groups with no expanded items', function (assert) {
    const parameterGroups = getNormalizedParameterGroups(
      {},
      {},
      { job1: { a: true, b: { value: 'xyz' } }, job2: { j2: 123 } },
      { job1: { b: '123xyz' }, job2: { j2: 999 } },
      null
    );

    assert.equal(parameterGroups.length, 2);
    assert.deepEqual(parameterGroups[0], {
      jobName: 'job1',
      parameters: [
        { name: 'a', value: true, defaultValues: true, description: '' },
        { name: 'b', value: 'xyz', defaultValues: '123xyz', description: '' }
      ],
      isOpen: false,
      paramGroupTitle: 'Job: job1'
    });
    assert.deepEqual(parameterGroups[1], {
      jobName: 'job2',
      parameters: [
        { name: 'j2', value: 123, defaultValues: 999, description: '' }
      ],
      isOpen: false,
      paramGroupTitle: 'Job: job2'
    });
  });

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
