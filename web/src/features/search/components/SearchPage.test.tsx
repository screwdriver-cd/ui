import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { SearchPage } from './SearchPage';

const pipelines = (names: string[]) =>
  names.map((name, i) => ({
    id: i + 1,
    scmContext: 'github:github.com',
    scmRepo: { name, branch: 'main', url: `https://github.com/${name}` }
  }));

afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

const open = (url = '/search') =>
  renderPage(SearchPage, { path: '/search', url, extraPaths: ['/'] });

describe('SearchPage', () => {
  const base = {
    'GET /auth/contexts': () => [
      { context: 'github:github.com', displayName: 'github.com' }
    ],
    'GET /collections': () => [
      { id: 5, name: 'Team', type: 'normal', pipelineIds: [] }
    ]
  };

  it('searches with whitespace removed and lists results with their account', async () => {
    signIn();
    const { calls } = mockApi({
      ...base,
      'GET /pipelines': () => pipelines(['foo/a', 'foo/b'])
    });

    open('/search?query=foo%20a');

    expect(await screen.findByText('Showing 2 results')).toBeInTheDocument();
    const search = calls.find(c => c.path === '/pipelines')!;

    expect(search.query.get('search')).toBe('fooa');
    expect(search.query.get('sortBy')).toBe('name');
    expect(screen.getAllByText('github.com').length).toBe(2);
    expect(screen.getByRole('link', { name: 'foo/a' })).toHaveAttribute(
      'href',
      '/v2/pipelines/1/events'
    );
  });

  it('tells monorepo pipelines apart by their root directory', async () => {
    mockApi({
      ...base,
      'GET /pipelines': () =>
        ['api', 'web'].map((rootDir, i) => ({
          id: i + 1,
          scmContext: 'github:github.com',
          scmRepo: { name: 'foo/mono', branch: 'main', url: 'https://github.com/foo/mono', rootDir }
        }))
    });

    open('/search?query=mono');

    expect(await screen.findByText('main:api')).toBeInTheDocument();
    expect(screen.getByText('main:web')).toBeInTheDocument();
  });

  it('shows the empty state and hides "Add to Collection" for signed out users', async () => {
    mockApi({ ...base, 'GET /pipelines': () => [] });

    open();

    expect(await screen.findByText('No results')).toBeInTheDocument();
    expect(
      screen.queryByRole('columnheader', { name: 'Add to Collection' })
    ).not.toBeInTheDocument();
  });

  it('loads more results page by page', async () => {
    signIn();
    const { calls } = mockApi({
      ...base,
      'GET /pipelines': ({ url }) =>
        url.searchParams.get('page') === '1'
          ? pipelines(['foo/a'])
          : pipelines(['foo/b']).map(p => ({ ...p, id: 9 }))
    });

    open();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Show more results...' })
    );

    expect(await screen.findByText('Showing 2 results')).toBeInTheDocument();
    expect(
      calls.filter(c => c.path === '/pipelines').map(c => c.query.get('page'))
    ).toEqual(['1', '2']);
  });

  it('offers more results after a page larger than the page size (several SCMs)', async () => {
    const names = Array.from({ length: 60 }, (_, i) => `foo/r${i}`);

    mockApi({
      ...base,
      'GET /pipelines': ({ url }) =>
        url.searchParams.get('page') === '1' ? pipelines(names) : []
    });

    open();

    expect(await screen.findByText('Showing 60 results')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show more results...' })
    ).toBeInTheDocument();
  });

  it('adds a pipeline to a collection', async () => {
    signIn();
    const { calls } = mockApi({
      ...base,
      'GET /pipelines': () => pipelines(['foo/a']),
      'PUT /collections/5/pipelines': () => ({})
    });

    open();
    const row = (await screen.findByRole('link', { name: 'foo/a' })).closest(
      'tr'
    )!;

    await userEvent.click(
      within(row).getByRole('button', { name: 'Add foo/a to a collection' })
    );
    await userEvent.click(await screen.findByRole('button', { name: 'Team' }));

    expect(
      await screen.findByText('Successfully added Pipeline to Collection Team')
    ).toBeInTheDocument();
    expect(calls.find(c => c.method === 'PUT')!.query.getAll('ids[]')).toEqual([
      '1'
    ]);
  });

  it('submits a new search into the url', async () => {
    mockApi({ ...base, 'GET /pipelines': () => [] });
    const { router } = open();

    await userEvent.type(
      await screen.findByLabelText('Search Screwdriver pipelines'),
      'abc{Enter}'
    );

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ query: 'abc' })
    );
  });
});
