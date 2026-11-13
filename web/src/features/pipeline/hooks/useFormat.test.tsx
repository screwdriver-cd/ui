import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nProvider } from '~/i18n/I18nProvider';
import type { AnyLocale } from '~/i18n/locale';
import { mockFetch, signIn, signOut } from '~/test/feature-router';
import { useFormatDateTime, useFormatRelative } from './useFormat';

const wrapper =
  (locale: AnyLocale = 'en') =>
  ({ children }: { children: ReactNode }) => (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <I18nProvider initialLocale={locale}>{children}</I18nProvider>
    </QueryClientProvider>
  );

const formatIn = (
  locale: string,
  value: string,
  timeZone: string | undefined
) =>
  new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone
  }).format(new Date(value));

// 03:04 UTC is the previous evening in Los Angeles, so UTC vs local shows.
const WHEN = '2020-01-02T03:04:00Z';

describe('useFormatDateTime', () => {
  beforeEach(() => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    signIn();
  });
  afterEach(() => {
    signOut();
  });

  const settings = (body: Record<string, unknown>) =>
    mockFetch([[/\/users\/settings$/, () => body]]);

  it('formats in the local time zone unless the user prefers UTC', async () => {
    const { calls } = settings({});
    const { result } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(result.current(WHEN)).toMatch(/Jan 1, 2020, 7:04\sPM/);
    expect(result.current(WHEN)).toBe(formatIn('en', WHEN, undefined));
  });

  it('switches to UTC once the user setting says so', async () => {
    settings({ timestampFormat: 'UTC' });
    const { result } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });

    await waitFor(() =>
      expect(result.current(WHEN)).toMatch(/Jan 2, 2020, 3:04\sAM/)
    );
  });

  it('uses the viewer language, and English for the pseudo-locale', async () => {
    settings({ timestampFormat: 'UTC' });
    const ja = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper('ja')
    });
    const xa = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper('en-XA')
    });

    await waitFor(() =>
      expect(ja.result.current(WHEN)).toBe(formatIn('ja', WHEN, 'UTC'))
    );
    expect(ja.result.current(WHEN)).toContain('2020');
    expect(ja.result.current(WHEN)).not.toMatch(/Jan/);
    await waitFor(() =>
      expect(xa.result.current(WHEN)).toBe(formatIn('en', WHEN, 'UTC'))
    );
  });

  it('accepts epoch numbers and Date objects', async () => {
    settings({ timestampFormat: 'UTC' });
    const { result } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });
    const expected = formatIn('en', WHEN, 'UTC');

    await waitFor(() => expect(result.current(WHEN)).toBe(expected));
    expect(result.current(Date.parse(WHEN))).toBe(expected);
    expect(result.current(new Date(WHEN))).toBe(expected);
  });

  it('returns an empty string for missing or unparseable values', () => {
    settings({});
    const { result } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });

    expect(result.current(undefined)).toBe('');
    expect(result.current(null)).toBe('');
    expect(result.current('')).toBe('');
    expect(result.current('not a date')).toBe('');
  });

  it('falls back to ISO text when Intl cannot format', () => {
    settings({});
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new RangeError('unsupported');
    });
    const { result } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });

    expect(result.current(WHEN)).toBe('2020-01-02T03:04:00.000Z');
  });

  it('keeps the formatter identity while nothing it depends on changes', async () => {
    const { calls } = settings({});
    const { result, rerender } = renderHook(() => useFormatDateTime(), {
      wrapper: wrapper()
    });

    await waitFor(() => expect(calls).toHaveLength(1));
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });
});

describe('useFormatRelative', () => {
  const NOW = Date.parse('2020-06-15T12:00:00Z');
  const at = (seconds: number) => NOW + seconds * 1000;

  it('picks the largest unit the difference reaches', () => {
    const { result } = renderHook(() => useFormatRelative(), {
      wrapper: wrapper()
    });
    const rel = (seconds: number) => result.current(at(seconds), NOW);

    expect(rel(-30)).toBe('30 seconds ago');
    expect(rel(-59 * 60)).toBe('59 minutes ago');
    expect(rel(-3 * 3600)).toBe('3 hours ago');
    expect(rel(3 * 86400)).toBe('in 3 days');
    expect(rel(-60 * 86400)).toBe('2 months ago');
    expect(rel(-2 * 31536000)).toBe('2 years ago');
  });

  it('uses words like "now" and "yesterday" (numeric: auto)', () => {
    const { result } = renderHook(() => useFormatRelative(), {
      wrapper: wrapper()
    });

    expect(result.current(NOW, NOW)).toBe('now');
    expect(result.current(at(-86400), NOW)).toBe('yesterday');
    expect(result.current(at(60), NOW)).toBe('in 1 minute');
  });

  it('switches units exactly at the boundary', () => {
    const { result } = renderHook(() => useFormatRelative(), {
      wrapper: wrapper()
    });

    expect(result.current(at(-59), NOW)).toBe('59 seconds ago');
    expect(result.current(at(-3599), NOW)).toBe('60 minutes ago');
    expect(result.current(at(-3600), NOW)).toBe('1 hour ago');
  });

  it('accepts ISO strings and defaults "now" to the current time', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    const { result } = renderHook(() => useFormatRelative(), {
      wrapper: wrapper()
    });

    expect(result.current('2020-06-15T10:00:00Z')).toBe('2 hours ago');
  });

  it('uses the viewer language, and English for the pseudo-locale', () => {
    const ja = renderHook(() => useFormatRelative(), {
      wrapper: wrapper('ja')
    });
    const xa = renderHook(() => useFormatRelative(), {
      wrapper: wrapper('en-XA')
    });

    expect(ja.result.current(at(-3 * 86400), NOW)).toBe(
      new Intl.RelativeTimeFormat('ja', { numeric: 'auto' }).format(-3, 'day')
    );
    expect(ja.result.current(at(-3 * 86400), NOW)).not.toMatch(/ago/);
    expect(xa.result.current(at(-3 * 86400), NOW)).toBe('3 days ago');
  });
});
