import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { config } from '~/config/config';
import { mockFetch, signIn } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import { AppShell } from './AppShell';

async function renderShell(locale: 'en' | 'ja' = 'en') {
  const root = createRootRoute({ component: AppShell });
  const index = createRoute({ getParentRoute: () => root, path: '/', component: () => <p>home page</p> });
  const search = createRoute({
    getParentRoute: () => root,
    path: '/search',
    validateSearch: (s: Record<string, unknown>) => ({ query: String(s.query ?? '') }),
    component: () => <p>search page</p>
  });
  const router = createRouter({ routeTree: root.addChildren([index, search]), history: createMemoryHistory({ initialEntries: ['/'] }) });

  renderWithProviders(<RouterProvider router={router} />, { locale });
  await act(async () => {
    await router.load();
  });

  return router;
}

const original = { ...config };

beforeEach(() => {
  mockFetch([
    ['/v4/auth/contexts', () => [
      { context: 'github:github.com', displayName: 'github.com' },
      { context: 'gitlab:gitlab.com', displayName: 'gitlab.com' }
    ]]
  ]);
});

afterEach(() => {
  Object.assign(config, original);
  getSession().set(null);
  vi.unstubAllGlobals();
});

describe('header search', () => {
  it('navigates to /search?query= on Enter', async () => {
    signIn();
    const router = await renderShell();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search' }), 'my pipeline{Enter}');

    await waitFor(() => expect(router.state.location.pathname).toBe('/search'));
    expect(router.state.location.search).toEqual({ query: 'my pipeline' });
  });

  it('ignores the Enter that confirms an IME conversion', async () => {
    signIn();
    const router = await renderShell('ja');

    fireEvent.click(screen.getByRole('button', { name: '検索' }));
    const box = screen.getByRole('searchbox');

    fireEvent.change(box, { target: { value: 'パイプライン' } });
    fireEvent.compositionStart(box);
    // Default prevented: the browser's implicit form submission does not happen.
    expect(fireEvent.keyDown(box, { key: 'Enter', keyCode: 229 })).toBe(false);
    fireEvent.compositionEnd(box);
    expect(router.state.location.pathname).toBe('/');
    // A plain Enter is left alone so the form submits normally.
    expect(fireEvent.keyDown(box, { key: 'Enter' })).toBe(true);

    fireEvent.submit(box.closest('form') as HTMLFormElement);
    await waitFor(() => expect(router.state.location.pathname).toBe('/search'));
    expect(router.state.location.search).toEqual({ query: 'パイプライン' });
  });

  it('does not navigate for blank input', async () => {
    signIn();
    const router = await renderShell();

    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    fireEvent.submit(screen.getByRole('search'));
    expect(router.state.location.pathname).toBe('/');
  });
});

describe('help menu', () => {
  it('links to the configured docs and slack, and shows the release version', async () => {
    Object.assign(config, { docUrl: 'https://docs.example/sd', slackUrl: 'https://slack.example/sd', releaseVersion: 'v1.2.3' });
    signIn();
    await renderShell();

    await userEvent.click(screen.getByRole('button', { name: 'Help' }));
    expect(screen.getByRole('link', { name: 'Documentation' })).toHaveAttribute('href', 'https://docs.example/sd');
    expect(screen.getByRole('link', { name: 'Slack Workspace' })).toHaveAttribute('href', 'https://slack.example/sd');
    expect(screen.getByText('Release v1.2.3')).toBeInTheDocument();
  });
});

describe('profile menu', () => {
  it('shows an avatar badge with the initial when showAvatar is on', async () => {
    signIn();
    config.showAvatar = true;
    await renderShell();
    expect(within(screen.getByRole('button', { name: 'Profile' })).getByText('B')).toBeInTheDocument();
  });

  it('omits the avatar when showAvatar is off', async () => {
    signIn();
    config.showAvatar = false;
    await renderShell();
    const profile = screen.getByRole('button', { name: 'Profile' });

    expect(within(profile).queryByText('B')).toBeNull();
    expect(within(profile).getByText('batman')).toBeInTheDocument();
  });

  it('marks the current account and offers the others, user settings and sign out', async () => {
    signIn();
    await renderShell();
    await userEvent.click(screen.getByRole('button', { name: 'Profile' }));

    expect(await screen.findByRole('button', { name: 'gitlab.com' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /github\.com/ })).toBeNull();
    expect(screen.getByText('github.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'User Settings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});

describe('sessions', () => {
  it('shows Create Pipeline to signed-in users', async () => {
    signIn();
    await renderShell();
    expect(screen.getByRole('link', { name: 'Create Pipeline' })).toBeInTheDocument();
  });

  it('shows sign-in, not the profile menu or create, to guests', async () => {
    getSession().set({ username: 'guest', scope: ['guest'], isGuest: true, token: 'x' });
    await renderShell();

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('link', { name: 'Create Pipeline' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull();
  });

  it('shows sign-in when signed out', async () => {
    await renderShell();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Create Pipeline' })).toBeNull();
  });
});
