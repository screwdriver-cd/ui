import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nProvider } from '~/i18n/I18nProvider';
import type { AnyLocale } from '~/i18n/locale';

/** Render with the providers every component expects (i18n + query cache). */
export function renderWithProviders(
  ui: ReactElement,
  { locale = 'en', ...options }: { locale?: AnyLocale } & Omit<RenderOptions, 'wrapper'> = {}
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return {
    queryClient,
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <I18nProvider initialLocale={locale}>{children}</I18nProvider>
        </QueryClientProvider>
      ),
      ...options
    })
  };
}
