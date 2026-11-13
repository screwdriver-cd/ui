import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { DashboardIndexPage, DashboardShowPage, HomePage } from './pages';

const pipeline = (id: number, name: string) => ({
  id,
  scmRepo: { name, branch: 'main', url: `https://github.com/${name}` }
});
const collections = [
  { id: 1, name: 'My Pipelines', type: 'default', pipelineIds: [10, 11] },
  { id: 2, name: 'Team', type: 'normal', pipelineIds: [] }
];
const metrics = [
  {
    id: 1,
    createTime: '2019-03-12T01:09:55.973Z',
    status: 'SUCCESS',
    duration: 61,
    sha: 'abcdef1234',
    commit: { message: 'Ship it', url: 'https://github.com/x' }
  }
];

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

describe('HomePage', () => {
  it('redirects to the default collection', async () => {
    mockApi({ 'GET /collections': () => collections });
    const { router } = renderPage(HomePage, {
      path: '/',
      extraPaths: ['/dashboards/$collectionId']
    });

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboards/1')
    );
  });

  it('prefers the last viewed collection', async () => {
    localStorage.setItem('lastViewedCollectionId', '2');
    mockApi({ 'GET /collections': () => collections });
    const { router } = renderPage(HomePage, {
      path: '/',
      extraPaths: ['/dashboards/$collectionId']
    });

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/dashboards/2')
    );
  });

  it('shows the hero and does not fetch collections for guests', async () => {
    signIn({ scope: ['guest'] });
    const { calls } = mockApi({ 'GET /collections': () => collections });

    renderPage(HomePage, {
      path: '/',
      extraPaths: ['/dashboards/$collectionId']
    });

    expect(
      await screen.findByRole('heading', { name: 'Introducing Screwdriver' })
    ).toBeInTheDocument();
    expect(calls).toHaveLength(0);
  });

  it('can be shown in Japanese', async () => {
    signIn({ scope: ['guest'] });
    mockApi({});
    renderPage(HomePage, { path: '/', locale: 'ja' });

    expect(
      await screen.findByRole('heading', { name: 'Screwdriver へようこそ' })
    ).toBeInTheDocument();
  });
});

describe('DashboardIndexPage', () => {
  it('goes to the last collection, or to search when there are none', async () => {
    mockApi({ 'GET /collections': () => collections });
    const first = renderPage(DashboardIndexPage, {
      path: '/dashboards',
      url: '/dashboards',
      extraPaths: ['/dashboards/$collectionId', '/search']
    });

    await waitFor(() =>
      expect(first.router.state.location.pathname).toBe('/dashboards/2')
    );
    first.unmount();

    mockApi({ 'GET /collections': () => [] });
    const second = renderPage(DashboardIndexPage, {
      path: '/dashboards',
      url: '/dashboards',
      extraPaths: ['/dashboards/$collectionId', '/search']
    });

    await waitFor(() =>
      expect(second.router.state.location.pathname).toBe('/search')
    );
  });
});

describe('DashboardShowPage', () => {
  const routes = (extra: Record<string, () => unknown> = {}) =>
    mockApi({
      'GET /collections': () => collections,
      'GET /collections/1': () => ({
        ...collections[0],
        pipelines: [pipeline(11, 'foo/zed'), pipeline(10, 'foo/alpha')]
      }),
      'GET /pipelines/:id/metrics': () => metrics,
      ...extra
    });
  const open = () =>
    renderPage(DashboardShowPage, {
      path: '/dashboards/$collectionId',
      url: '/dashboards/1',
      extraPaths: ['/']
    });

  it('lists the collections and the pipelines sorted by name with their last run', async () => {
    routes();
    open();

    const cards = await screen.findAllByTestId('pipeline-card');

    expect(
      cards.map(card => within(card).getAllByRole('link')[0]!.textContent)
    ).toEqual(['foo/alpha', 'foo/zed']);
    expect(await within(cards[0]!).findByText('abcdef1')).toBeInTheDocument();
    expect(within(cards[0]!).getByText('Ship it')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Team' })).toBeInTheDocument();
    expect(localStorage.getItem('lastViewedCollectionId')).toBe('1');
  });

  it('switches to the list view and remembers it', async () => {
    routes();
    open();
    await screen.findAllByTestId('pipeline-card');

    await userEvent.click(screen.getByRole('button', { name: 'List' }));

    expect(await screen.findAllByTestId('pipeline-row')).toHaveLength(2);
    expect(localStorage.getItem('activeViewOptionValue')).toBe('List');
  });

  it('organizes pipelines and copies the selection to another collection', async () => {
    const { calls } = routes({ 'PUT /collections/2/pipelines': () => ({}) });

    open();
    await screen.findAllByTestId('pipeline-card');

    await userEvent.click(screen.getByRole('button', { name: 'Organize' }));
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Select foo/alpha' })
    );
    expect(screen.getByText('1 Selected')).toBeInTheDocument();
    // The default collection cannot lose pipelines.
    expect(
      screen.queryByRole('button', { name: 'Remove' })
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy To' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Team' }));

    await waitFor(() =>
      expect(
        calls.some(
          c => c.method === 'PUT' && c.path === '/collections/2/pipelines'
        )
      ).toBe(true)
    );
    const put = calls.find(c => c.method === 'PUT')!;

    expect(put.query.getAll('ids[]')).toEqual(['10']);
  });

  it('shows a not found message for a missing collection', async () => {
    mockApi({
      'GET /collections': () => collections,
      'GET /collections/1': () => [404, { message: 'nope' }]
    });
    localStorage.setItem('lastViewedCollectionId', '1');
    open();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Collection not found'
    );
    expect(localStorage.getItem('lastViewedCollectionId')).toBeNull();
  });
});
