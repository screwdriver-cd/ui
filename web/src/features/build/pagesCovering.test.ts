import { pagesCovering } from './api';

/** The store returns whole storage pages (the first one from `from` on) per requested page. */
const served = (from: number, pages: number, pageSize: number) => {
  const lines: number[] = [];
  let start = from;

  for (let i = 0; i < pages; i += 1) {
    const stop = (Math.floor(start / pageSize) + 1) * pageSize;

    for (let n = start; n < stop; n += 1) {
      lines.push(n);
    }
    start = stop;
  }

  return lines;
};

describe('pagesCovering', () => {
  it('uses one page per 100 lines when the read is page aligned', () => {
    expect(pagesCovering(4000, 5000)).toBe(10);
  });

  it('adds a page when the read starts mid-page', () => {
    expect(pagesCovering(950, 1950)).toBe(11);
  });

  it.each([100, 1000])('reaches the line before `end` with %i line storage pages', size => {
    const cases: Array<[number, number]> = [
      [0, 1000],
      [950, 1950],
      [37, 1037],
      [1500, 2500]
    ];

    for (const [from, end] of cases) {
      const got = served(from, pagesCovering(from, end), size);

      expect(got).toContain(end - 1);
      expect(got[0]).toBe(from);
    }
  });
});
