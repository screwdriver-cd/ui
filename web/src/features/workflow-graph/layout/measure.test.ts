import { describe, expect, it } from 'vitest';
import { createTextMeasurer, estimateTextWidth } from './measure';

describe('text measurement', () => {
  it('measures CJK wider than latin per character', () => {
    const latin = estimateTextWidth('abcdef', 13);
    const cjk = estimateTextWidth('ビルドテスト', 13);

    expect(cjk).toBeGreaterThan(latin);
    expect(cjk).toBe(6 * 13);
  });

  it('handles surrogate pairs, empty text and control chars', () => {
    expect(estimateTextWidth('', 13)).toBe(0);
    expect(estimateTextWidth('𠮷', 10)).toBe(10);
    expect(estimateTextWidth('\n', 10)).toBe(0);
  });

  it('falls back to the estimate in jsdom (no canvas)', () => {
    const m = createTextMeasurer();

    expect(m('ビルド')).toBe(estimateTextWidth('ビルド', 13));
    expect(m('main')).toBe(estimateTextWidth('main', 13));
  });
});
