import { useCallback } from 'react';
import { useIntl, type IntlShape } from 'react-intl';

export type TValues = Parameters<IntlShape['formatMessage']>[1];

/**
 * `const t = useT(); t('nav.collection')`. Ids live in
 * src/locales/*.json and src/features/<feature>/locales/*.json; the i18n
 * parity test checks that every id used in code exists in both languages.
 */
export function useT() {
  const intl = useIntl();

  return useCallback(
    (id: string, values?: TValues) => intl.formatMessage({ id }, values) as unknown as string,
    [intl]
  );
}
