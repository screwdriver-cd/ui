const UNITS: Array<[Intl.NumberFormatOptions['unit'], number]> = [
  ['day', 86_400_000],
  ['hour', 3_600_000],
  ['minute', 60_000],
  ['second', 1000]
];

/** `1h 4m`, `3s`: the `largest` non-zero units, localized through Intl. */
export function formatDuration(ms: number, locale: string, largest = 2): string {
  const parts: string[] = [];
  let rest = ms;

  for (const [unit, size] of UNITS) {
    if (parts.length >= largest) {
      break;
    }
    const value = Math.floor(rest / size);

    if (value > 0) {
      parts.push(new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'narrow' }).format(value));
      rest -= value * size;
    }
  }

  if (parts.length === 0) {
    return new Intl.NumberFormat(locale, { style: 'unit', unit: 'second', unitDisplay: 'narrow' }).format(
      ms < 1000 ? 0 : 1
    );
  }

  return parts.join(' ');
}
