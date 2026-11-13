import { PSEUDO_LOCALE, type AnyLocale, type Locale } from './locale';
import { pseudoLocalizeAll } from './pseudo';

type Dict = Record<string, string>;

// Common messages live in src/locales, feature messages in
// src/features/<feature>/locales, so features never edit the same file.
const en = import.meta.glob<Dict>(['../locales/en.json', '../features/*/locales/en.json'], {
  eager: true,
  import: 'default'
});
const ja = import.meta.glob<Dict>(['../locales/ja.json', '../features/*/locales/ja.json'], {
  eager: true,
  import: 'default'
});

const merge = (modules: Record<string, Dict>): Dict =>
  Object.assign({}, ...Object.values(modules));

export const messagesByLocale: Record<Locale, Dict> = { en: merge(en), ja: merge(ja) };

export function getMessages(locale: AnyLocale): Dict {
  if (locale === PSEUDO_LOCALE) {
    return pseudoLocalizeAll(messagesByLocale.en);
  }

  // Missing Japanese keys fall back to English instead of showing an id;
  // the parity test keeps this from happening in practice.
  return locale === 'ja' ? { ...messagesByLocale.en, ...messagesByLocale.ja } : messagesByLocale.en;
}
