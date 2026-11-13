export const SUPPORTED_LOCALES = ['en', 'ja'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
/** Elongated, accented English for catching truncation and layout bugs. */
export const PSEUDO_LOCALE = 'en-XA';
export type AnyLocale = Locale | typeof PSEUDO_LOCALE;

export const LOCALE_STORAGE_KEY = 'sd-locale';

const isSupported = (value: string | null | undefined): value is Locale =>
  !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);

/** `en-US` -> `en`, `ja-JP` -> `ja`. */
export const toSupported = (tag: string): Locale | null => {
  const base = tag.toLowerCase().split('-')[0];

  return isSupported(base) ? base : null;
};

/**
 * Order: ?locale= (also allows the pseudo-locale) -> saved preference ->
 * browser languages -> English.
 */
export function detectLocale(
  search = typeof window === 'undefined' ? '' : window.location.search,
  languages: readonly string[] = typeof navigator === 'undefined' ? [] : navigator.languages,
  stored: string | null = safeGet(LOCALE_STORAGE_KEY)
): AnyLocale {
  const fromUrl = new URLSearchParams(search).get('locale');

  if (fromUrl === PSEUDO_LOCALE) {
    return PSEUDO_LOCALE;
  }
  if (isSupported(fromUrl)) {
    return fromUrl;
  }
  if (isSupported(stored)) {
    return stored;
  }
  for (const tag of languages) {
    const match = toSupported(tag);

    if (match) {
      return match;
    }
  }

  return 'en';
}

export function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
