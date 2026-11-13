import { useCallback } from 'react';
import { useLocale } from '~/i18n/I18nProvider';
import { useUserSettings } from '../api/queries';

/** Date + time in the viewer's language, honouring the user's UTC-vs-local preference. */
export function useFormatDateTime() {
  const { locale } = useLocale();
  const settings = useUserSettings();
  const utc = settings.data?.timestampFormat === 'UTC';

  return useCallback(
    (value: string | number | Date | undefined | null) => {
      if (value === undefined || value === null || value === '') {
        return '';
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return '';
      }

      try {
        return new Intl.DateTimeFormat(locale === 'en-XA' ? 'en' : locale, {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: utc ? 'UTC' : undefined
        }).format(date);
      } catch {
        return date.toISOString();
      }
    },
    [locale, utc]
  );
}

/** "3 days ago" style text via Intl.RelativeTimeFormat. */
export function useFormatRelative() {
  const { locale } = useLocale();

  return useCallback(
    (value: string | number | Date, now = Date.now()) => {
      const diffSeconds = Math.round((new Date(value).getTime() - now) / 1000);
      const rtf = new Intl.RelativeTimeFormat(
        locale === 'en-XA' ? 'en' : locale,
        { numeric: 'auto' }
      );
      const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ['year', 31536000],
        ['month', 2592000],
        ['day', 86400],
        ['hour', 3600],
        ['minute', 60]
      ];

      for (const [unit, size] of steps) {
        if (Math.abs(diffSeconds) >= size) {
          return rtf.format(Math.round(diffSeconds / size), unit);
        }
      }

      return rtf.format(diffSeconds, 'second');
    },
    [locale]
  );
}
