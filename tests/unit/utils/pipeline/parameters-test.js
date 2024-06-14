import { module, test } from 'qunit';
import {
  normalizeParameters,
  getNormalizedParameterGroups
} from 'screwdriver-ui/utils/pipeline/parameters';

module('Unit | Utility | Pipeline | parameters', function () {
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
        param3: { value: 'something', description: 'some description' }
      },
      {
        param1: false,
        param2: { value: 'xyz', description: 'param description' },
        param3: { value: 'default value' }
      }
    );

    assert.equal(parameters.length, 3);
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
});
