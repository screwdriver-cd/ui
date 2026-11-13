import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from './routes';

let nextId = 1;
const tpl = (
  namespace: string,
  name: string,
  version: string,
  extra: object = {}
) => ({
  id: nextId++,
  namespace,
  name,
  version,
  description: `${name} desc`,
  maintainer: 'a@b.c',
  createTime: '2020-01-01T00:00:00.000Z',
  config: { image: 'node:20', steps: [{ install: 'npm install' }] },
  metrics: {
    jobs: { count: 3 },
    builds: { count: 9 },
    pipelines: { count: 2 }
  },
  ...extra
});

const jobList = [
  tpl('chef', 'publish', '1.0.1', { trusted: true }),
  tpl('chef', 'publish', '1.0.0'),
  tpl('nodejs', 'build', '2.0.0')
];

function jobRoutes(extra: Parameters<typeof mockFetch>[0] = []) {
  return mockFetch([
    ...extra,
    [
      /\/templates\/chef%2Fpublish\/metrics$/,
      () => [
        tpl('chef', 'publish', '1.0.1', { trusted: true }),
        tpl('chef', 'publish', '1.0.0')
      ]
    ],
    [
      /\/templates\/chef%2Fpublish\/tags$/,
      () => [{ tag: 'stable', version: '1.0.0' }]
    ],
    [/\/pipeline\/templates$/, () => [tpl('p', 'pt', '1.0.0')]],
    [/\/templates$/, () => jobList],
    [/\/users\/settings$/, () => ({})]
  ]);
}

describe('templates', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('redirects /templates to the pipeline templates list', async () => {
    jobRoutes();
    const { router } = await renderFeature(createRoutes, '/templates');

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/templates/pipeline')
    );
    expect(await screen.findByText('pt')).toBeInTheDocument();
  });

  it('shows an empty pipeline template list, not an error, when the API answers 404', async () => {
    mockFetch([
      [/\/pipeline\/templates$/, () => new Response(JSON.stringify({ message: 'Pipeline templates do not exist' }), { status: 404 })],
      [/\/templates$/, () => jobList],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/templates/pipeline');

    await waitFor(() => expect(screen.queryByText(/loading/i)).toBeNull());
    expect(screen.queryByText('Something went wrong.')).toBeNull();
  });

  it('lists one row per job template and filters by search', async () => {
    jobRoutes();
    await renderFeature(createRoutes, '/templates/job');

    expect(await screen.findByText('publish')).toBeInTheDocument();
    expect(screen.getAllByText('publish')).toHaveLength(1);
    expect(screen.getByText('build')).toBeInTheDocument();
    await userEvent.type(
      screen.getByPlaceholderText('Search job templates'),
      'nodejs'
    );
    await waitFor(() => expect(screen.queryByText('publish')).toBeNull());
    expect(screen.getByText('build')).toBeInTheDocument();
  });

  it('shows a version page with versions, tags and config', async () => {
    jobRoutes();
    await renderFeature(createRoutes, '/templates/job/chef/publish/1.0.1');

    expect(await screen.findByText('All Versions')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: /1\.0\.0.*stable/ })
    ).toBeInTheDocument();
    // structured like the validator: the step, then the raw YAML folded underneath
    expect(screen.getByText('npm install', { selector: 'pre' })).toBeInTheDocument();
    expect(screen.getByText('Source (YAML)')).toBeInTheDocument();
  });

  it('resolves a tag in the URL to its version', async () => {
    jobRoutes();
    await renderFeature(createRoutes, '/templates/job/chef/publish/stable');

    expect(await screen.findByText('All Versions')).toBeInTheDocument();
    expect(screen.queryByText('Template not found')).toBeNull();
  });

  it('still shows the template when its tags fail to load', async () => {
    jobRoutes([[/\/templates\/chef%2Fpublish\/tags$/, () => 500]]);
    await renderFeature(createRoutes, '/templates/job/chef/publish/1.0.1');

    expect(await screen.findByText('All Versions')).toBeInTheDocument();
  });

  it('shows not found for an unknown template', async () => {
    jobRoutes([[/\/templates\/nope%2Fnone\/metrics$/, () => []]]);
    await renderFeature(createRoutes, '/templates/job/nope/none');
    expect(await screen.findByText('Template not found')).toBeInTheDocument();
  });

  it('redirects a legacy /templates/ns/name URL to the job template page', async () => {
    jobRoutes();
    const { router } = await renderFeature(
      createRoutes,
      '/templates/chef/publish'
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/templates/job/chef/publish')
    );
  });

  it('confirms before deleting all versions', async () => {
    getSession().set({
      username: 'adm',
      scope: ['user', 'admin'],
      isGuest: false,
      token: 'h.' + btoa('{"username":"adm","scope":["user","admin"]}') + '.s'
    });
    const { fn } = jobRoutes([[/\/templates\/chef%2Fpublish$/, () => ({})]]);

    await renderFeature(createRoutes, '/templates/job/chef/publish');
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete' })
    );
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(/delete all versions and tags of chef\/publish/)
    ).toBeInTheDocument();
    expect(fn.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(false);
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm' })
    );
    await waitFor(() =>
      expect(fn.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(true)
    );
  });

  it('closes the delete confirmation when Back moves to another template', async () => {
    getSession().set({
      username: 'adm',
      scope: ['user', 'admin'],
      isGuest: false,
      token: 'h.' + btoa('{"username":"adm","scope":["user","admin"]}') + '.s'
    });
    const { fn } = jobRoutes([
      [/\/templates\/nodejs%2Fbuild\/metrics$/, () => [tpl('nodejs', 'build', '2.0.0')]],
      [/\/templates\/nodejs%2Fbuild\/tags$/, () => []]
    ]);
    const { router } = await renderFeature(createRoutes, '/templates/job/chef/publish');

    await screen.findByText('All Versions');
    await act(() => router.navigate({ to: '/templates/job/nodejs/build' }));
    await screen.findByText('build desc');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('nodejs/build');

    await act(async () => router.history.back());
    await screen.findByText('publish desc');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(fn.mock.calls.some(([, i]) => i?.method === 'DELETE')).toBe(false);
  });

  it('takes trust from the latest version, not the one being viewed', async () => {
    getSession().set({
      username: 'adm',
      scope: ['user', 'admin'],
      isGuest: false,
      token: 'h.' + btoa('{"username":"adm","scope":["user","admin"]}') + '.s'
    });
    const { fn } = jobRoutes([
      [/\/templates\/chef%2Fpublish\/trusted$/, () => ({})]
    ]);

    // 1.0.0 itself is not flagged, but the template (latest 1.0.1) is trusted: revoking must be possible.
    await renderFeature(createRoutes, '/templates/job/chef/publish/1.0.0');
    const toggle = await screen.findByRole('switch', { name: 'Trusted' });

    expect(toggle).toBeChecked();
    await userEvent.click(toggle);
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Confirm'
      })
    );
    await waitFor(() =>
      expect(
        fn.mock.calls.find(([, i]) => i?.method === 'PUT')?.[1]?.body
      ).toBe(JSON.stringify({ trusted: false }))
    );
  });

  it('renders the list in Japanese', async () => {
    jobRoutes();
    await renderFeature(createRoutes, '/templates/job', { locale: 'ja' });
    expect(await screen.findByText('publish')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ジョブテンプレートを検索')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search job templates')).toBeNull();
  });
});
