import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { detectLocale, LOCALE_STORAGE_KEY, PSEUDO_LOCALE, type AnyLocale, type Locale } from './locale';
import { getMessages } from './messages';

interface LocaleContextValue {
  locale: AnyLocale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', setLocale: () => {} });

export const useLocale = () => useContext(LocaleContext);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: AnyLocale }) {
  const [locale, setLocaleState] = useState<AnyLocale>(() => initialLocale ?? detectLocale());

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // not persisted
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === PSEUDO_LOCALE ? 'en' : locale;
  }, [locale]);

  const messages = useMemo(() => getMessages(locale), [locale]);
  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);
  // Intl APIs know `en-XA` as a plain English variant, which is what we want.
  const intlLocale = locale === PSEUDO_LOCALE ? 'en' : locale;

  return (
    <LocaleContext.Provider value={value}>
      <IntlProvider locale={intlLocale} messages={messages} defaultLocale="en" onError={() => {}}>
        {children}
      </IntlProvider>
    </LocaleContext.Provider>
  );
}
