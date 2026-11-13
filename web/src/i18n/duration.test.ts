import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('shows the two largest non-zero units by default', () => {
    expect(formatDuration(65_000, 'en')).toBe('1m 5s');
    expect(formatDuration(3_725_000, 'en')).toBe('1h 2m');
    expect(formatDuration(3_603_000, 'en')).toBe('1h 3s');
    expect(formatDuration(90_000_000, 'en')).toBe('1d 1h');
  });

  it('shows more units when asked', () => {
    expect(formatDuration(3_725_000, 'en', 3)).toBe('1h 2m 5s');
  });

  it('shows 0s under a second', () => {
    expect(formatDuration(200, 'en')).toBe('0s');
    expect(formatDuration(0, 'en')).toBe('0s');
  });

  it('formats numbers for the locale and accepts the pseudo-locale', () => {
    expect(formatDuration(1_000 * 86_400_000, 'en')).toBe('1,000d');
    expect(formatDuration(1_000 * 86_400_000, 'de')).toBe('1.000 T');
    expect(formatDuration(65_000, 'en-XA')).toBe('1m 5s');
  });
});
