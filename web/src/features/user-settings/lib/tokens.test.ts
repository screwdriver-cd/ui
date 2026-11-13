import { expiresAt } from './tokens';

describe('expiresAt', () => {
  it('computes dates and empty for no expiration', () => {
    const now = new Date('2026-01-01T00:00:00Z');

    expect(expiresAt('day1', now)).toBe('2026-01-02T00:00:00.000Z');
    expect(expiresAt('day30', now)).toBe('2026-01-31T00:00:00.000Z');
    expect(expiresAt('never', now)).toBe('');
  });
});
