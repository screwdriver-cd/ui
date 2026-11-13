import { getPrNumber, getPrNumbers } from './pr';

describe('getPrNumber', () => {
  it('reads the number after the PR- prefix, ignoring the job suffix', () => {
    expect(getPrNumber({ name: 'PR-12:main' })).toBe(12);
    expect(getPrNumber({ name: 'PR-7' })).toBe(7);
    expect(getPrNumber({ name: 'PR-1024:deploy-prod' })).toBe(1024);
  });

  it('is NaN when no number follows the prefix', () => {
    expect(getPrNumber({ name: 'PR-:main' })).toBeNaN();
    expect(getPrNumber({ name: 'main' })).toBeNaN();
  });

  it('does not check the prefix itself (callers pass PR jobs only)', () => {
    // The first three characters are dropped whatever they are.
    expect(getPrNumber({ name: 'XX-5:main' })).toBe(5);
  });
});

describe('getPrNumbers', () => {
  it('returns each PR number once, sorted numerically rather than as text', () => {
    expect(
      getPrNumbers([
        { name: 'PR-10:main' },
        { name: 'PR-9:main' },
        { name: 'PR-10:test' },
        { name: 'PR-100:main' },
        { name: 'PR-9:deploy' }
      ])
    ).toEqual([9, 10, 100]);
  });

  it('skips jobs whose name has no PR number', () => {
    expect(
      getPrNumbers([{ name: 'main' }, { name: 'PR-3:main' }, { name: 'PR-' }])
    ).toEqual([3]);
  });

  it('is empty for no jobs', () => {
    expect(getPrNumbers([])).toEqual([]);
  });
});
