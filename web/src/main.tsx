import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import { createAppRouter } from '~/app/router';
import { assetUrl } from '~/config/config';
import { useSession } from '~/auth/session';
import { I18nProvider } from '~/i18n/I18nProvider';
import './styles/global.scss';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } }
});
const router = createAppRouter(queryClient);

// Logging out (here or in another tab) goes back to the login page.
useSession.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) {
    queryClient.clear();
    window.location.assign(assetUrl('/login'));
  } else if (
    state.data &&
    previous.data &&
    (state.data.username !== previous.data.username || state.data.scmContext !== previous.data.scmContext)
  ) {
    // Signed in as someone else (account switch here or in another tab): nothing loaded for the old
    // account may stay visible. Clearing the cache does not refresh pages already on screen, so reload.
    queryClient.clear();
    window.location.reload();
  }
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <RouterProvider router={router} />
      </I18nProvider>
    </QueryClientProvider>
  </StrictMode>
);
