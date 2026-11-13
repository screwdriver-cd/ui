import {
  extractDefaultJobParameters,
  extractDefaultParameters,
  extractEventParameters,
  flattenParameters,
  getParameterGroups,
  isParameterized,
  normalizeParameters,
  validateParameters
} from './parameters';

describe('extractDefaultParameters', () => {
  it('takes the first choice, the value or the string itself', () => {
    expect(
      extractDefaultParameters({
        env: ['dev', 'prod'],
        tag: { value: 'latest', description: 'image tag' },
        pick: { value: ['a', 'b'] },
        plain: 'x'
      })
    ).toEqual({
      env: { value: 'dev' },
      tag: { value: 'latest' },
      pick: { value: 'a' },
      plain: { value: 'x' }
    });
  });

  it('is empty for no parameters', () => {
    expect(extractDefaultParameters(undefined)).toEqual({});
  });
});

describe('extractDefaultJobParameters', () => {
  it('maps job names to defaults and skips jobs without parameters', () => {
    const jobs = [
      { name: 'main', permutations: [{ parameters: { a: ['1', '2'] } }] },
      { name: 'test', permutations: [{}] },
      { name: 'none' }
    ];

    expect(extractDefaultJobParameters(jobs)).toEqual({
      main: { a: { value: '1' } }
    });
  });
});

describe('extractEventParameters', () => {
  it('splits pipeline-level {value} entries from job-level groups', () => {
    expect(
      extractEventParameters({
        env: { value: 'dev' },
        main: { a: { value: '1' } }
      })
    ).toEqual({
      pipelineParameters: { env: { value: 'dev' } },
      jobParameters: { main: { a: { value: '1' } } }
    });
  });
});

describe('normalizeParameters', () => {
  it('backfills the definition (choices, description) from the defaults', () => {
    expect(
      normalizeParameters(
        { env: { value: 'prod' } },
        { env: { value: ['dev', 'prod'], description: 'target' } }
      )
    ).toEqual([
      {
        name: 'env',
        value: 'prod',
        defaultValues: ['dev', 'prod'],
        description: 'target'
      }
    ]);
  });

  it('uses the current value as definition when there is none', () => {
    expect(normalizeParameters({ a: { value: '1' } })).toEqual([
      { name: 'a', value: '1', defaultValues: '1', description: '' }
    ]);
  });
});

describe('getParameterGroups', () => {
  const common = {
    sharedTitle: 'Shared',
    jobTitle: (n: string) => `Job: ${n}`
  };

  it('puts the started job first, then shared, then the others, with the first open', () => {
    const groups = getParameterGroups({
      ...common,
      pipelineParameters: { env: { value: 'dev' } },
      jobParameters: {
        build: { a: { value: '1' } },
        test: { b: { value: '2' } }
      },
      startFrom: 'test'
    });

    expect(groups.map(g => [g.title, g.isOpen])).toEqual([
      ['Job: test', true],
      ['Shared', false],
      ['Job: build', false]
    ]);
  });

  it('opens Shared when no job leads', () => {
    const groups = getParameterGroups({
      ...common,
      pipelineParameters: { env: { value: 'dev' } },
      jobParameters: { build: { a: { value: '1' } } }
    });

    expect(groups.map(g => g.title)).toEqual(['Shared', 'Job: build']);
    expect(groups[0]?.isOpen).toBe(true);
  });
});

describe('flattenParameters', () => {
  it('builds the request body', () => {
    expect(
      flattenParameters({
        pipeline: { env: { value: 'dev' } },
        job: { main: { a: { value: '1' } } }
      })
    ).toEqual({
      env: 'dev',
      main: { a: '1' }
    });
  });
});

describe('isParameterized', () => {
  it('is true when any source has entries', () => {
    expect(isParameterized({}, {}, undefined)).toBe(false);
    expect(isParameterized({ a: 'b' }, {}, undefined)).toBe(true);
    expect(
      isParameterized(undefined, { main: { a: { value: '1' } } }, undefined)
    ).toBe(true);
    expect(isParameterized(undefined, undefined, { a: { value: '1' } })).toBe(
      true
    );
  });
});

describe('validateParameters', () => {
  const groups = getParameterGroups({
    sharedTitle: 'Shared',
    jobTitle: n => n,
    pipelineParameters: { env: { value: 'dev' }, free: { value: '' } },
    pipelineDefinitions: { env: ['dev', 'prod'], free: '' },
    jobParameters: { main: { a: { value: '1' } } },
    jobDefinitions: { main: { a: '1' } }
  });

  it('accepts values, including typed overrides of a choice list', () => {
    expect(
      validateParameters(groups, {
        pipeline: { env: { value: 'staging' }, free: { value: '' } },
        job: { main: { a: { value: 'x' } } }
      })
    ).toEqual([]);
  });

  it('rejects a blank value when the parameter has a default, but not when it never had one', () => {
    expect(
      validateParameters(groups, {
        pipeline: { env: { value: ' ' }, free: { value: '' } },
        job: { main: { a: { value: '' } } }
      })
    ).toEqual([
      { group: null, name: 'env', reason: 'empty' },
      { group: 'main', name: 'a', reason: 'empty' }
    ]);
  });
});
