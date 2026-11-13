import type { TemplateItem } from './types';

/** `namespace/name`, or just `name` for the default namespace. */
export function getFullName({
  name,
  namespace
}: {
  name: string;
  namespace?: string;
}) {
  return namespace && namespace !== 'default' ? `${namespace}/${name}` : name;
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 86_400_000],
  ['month', 30 * 86_400_000],
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000]
];

/** "3 days ago" / "3日前", via Intl (replaces humanize-duration). */
export function relativeTime(
  date: string | undefined,
  locale: string,
  now = Date.now()
): string {
  if (!date) {
    return '';
  }
  const diff = new Date(date).getTime() - now;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  for (const [unit, size] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= size || unit === 'second') {
      return rtf.format(Math.round(diff / size), unit);
    }
  }

  return '';
}

/** Port of app/helpers/compare-versions.js. */
export function compareVersions(v1: string, v2: string): number {
  const a = v1.split('.');
  const b = v2.split('.');
  let limit = Math.max(a.length, b.length);
  let i1 = 0;
  let i2 = 0;

  while (limit) {
    limit -= 1;
    i1 = parseInt(a.shift() || '0', 10);
    i2 = parseInt(b.shift() || '0', 10);
    if (i1 !== i2) {
      break;
    }
  }

  return i1 > i2 ? 1 : i1 < i2 ? -1 : 0;
}

/** Adds fullName and a default description, and keeps one entry per fullName. */
export function formatTemplates<
  T extends Partial<TemplateItem> & { name: string; namespace: string }
>(
  items: T[],
  { dedupe = false }: { dedupe?: boolean } = {}
): Array<T & TemplateItem> {
  const seen = new Set<string>();
  const out: Array<T & TemplateItem> = [];

  for (const t of items) {
    const fullName = getFullName(t);

    if (dedupe) {
      if (seen.has(fullName)) {
        continue;
      }
      seen.add(fullName);
    }
    out.push({ ...t, fullName, description: t.description ?? '' } as T &
      TemplateItem);
  }

  return out;
}

const iso = (d: Date) => d.toISOString().slice(0, 16);

/** Port of utils/time-range.js: `6hr`, `1wk`, `180d`, `1yr`... -> ISO start/end (minute precision). */
export function timeRange(
  end: Date,
  range: string
): { startTime: string; endTime: string } | null {
  const match = range.match(/^(\d+)(\D+)$/);

  if (!match) {
    return null;
  }
  const quantity = Number(match[1]);
  const current = new Date(end);

  switch (match[2]) {
    case 'hr':
      current.setUTCHours(current.getUTCHours() - quantity);
      break;
    case 'd':
      current.setUTCDate(current.getUTCDate() - quantity);
      break;
    case 'wk':
      current.setUTCDate(current.getUTCDate() - quantity * 7);
      break;
    case 'mo':
      current.setUTCMonth(current.getUTCMonth() - quantity);
      break;
    case 'yr':
      current.setUTCFullYear(current.getUTCFullYear() - quantity);
      break;
    default:
      return null;
  }

  return { startTime: iso(current), endTime: iso(end) };
}

/** Pick the version a URL segment refers to: a tag, a full version, or a version prefix (latest match). */
export function resolveVersion(
  param: string,
  versions: Array<{ version: string }>,
  tags: Array<{ tag: string; version: string }>
): string | null {
  const prefixed = versions
    .filter(v => `${v.version}.`.startsWith(`${param}.`))
    .sort((a, b) => compareVersions(b.version, a.version));
  const tagged = tags.find(t => t.tag === param);

  if (prefixed[0]) {
    return prefixed[0].version;
  }

  return tagged ? tagged.version : null;
}

/**
 * Whether a template or command is trusted. The trust endpoint is not per version, so this is the
 * latest version's flag (Ember: `versions.some(v => v.trusted && v.latest)`), not the selected one's.
 * Without a `latest` flag the newest version (first in the list) stands in.
 */
export function isTrusted(
  versions: Array<{ trusted?: boolean; latest?: boolean }>
): boolean {
  const latest = versions.find(v => v.latest) ?? versions[0];

  return !!latest?.trusted;
}
