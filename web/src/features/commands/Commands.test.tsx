import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from './routes';

const cmd = (namespace: string, name: string, version: string, extra: object = {}) => ({
  namespace,
  name,
  version,
  description: `${name} desc`,
  maintainer: 'a@b.c',
  createTime: '2020-01-01T00:00:00.000Z',
  format: 'binary',
  binary: { file: './run.sh' },
  ...extra
});

function routes() {
  return mockFetch([
    [/\/commands\/foo\/bar\/tags$/, () => [{ tag: 'stable', version: '1.0.0' }]],
    [/\/commands\/foo\/bar$/, () => [cmd('foo', 'bar', '1.0.1'), cmd('foo', 'bar', '1.0.0')]],
    [/\/commands\/foo\/missing\/tags$/, () => []],
    [/\/commands\/foo\/missing$/, () => []],
    [/\/commands$/, () => [cmd('foo', 'bar', '1.0.1'), cmd('foo', 'bar', '1.0.0'), cmd('baz', 'qux', '2.0.0')]],
    [/\/users\/settings$/, () => ({})]
  ]);
}

describe('commands', () => {
  beforeEach(() => signIn());
  afterEach(() => {
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('lists commands once each and filters by search', async () => {
    routes();
    await renderFeature(createRoutes, '/commands');

    expect(await screen.findByText('bar')).toBeInTheDocument();
    expect(screen.getAllByText('bar')).toHaveLength(1);
    await userEvent.type(screen.getByPlaceholderText('Search commands'), 'qux');
    await waitFor(() => expect(screen.queryByText('bar')).toBeNull());
    expect(screen.getByText('qux')).toBeInTheDocument();
  });

  it('shows the detail page with versions, tag and format', async () => {
    routes();
    await renderFeature(createRoutes, '/commands/foo/bar');

    expect(await screen.findByText('Format: binary')).toBeInTheDocument();
    expect(screen.getByText('./run.sh')).toBeInTheDocument();
    expect(screen.getByText(/- stable/)).toBeInTheDocument();
  });

  it('shows the exact version, not @latest, for a version the API does not mark latest', async () => {
    mockFetch([
      [/\/commands\/foo\/pat\/tags$/, () => []],
      [/\/commands\/foo\/pat$/, () => [cmd('foo', 'pat', '1.0.1', { latest: false }), cmd('foo', 'pat', '2.0.0', { latest: true })]],
      [/\/users\/settings$/, () => ({})]
    ]);
    await renderFeature(createRoutes, '/commands/foo/pat/1.0.1');

    expect(await screen.findByText('sd-cmd exec foo/pat@1.0.1')).toBeInTheDocument();
  });

  it('closes the delete confirmation when Back moves to another command', async () => {
    getSession().set({ token: 't', username: 'admin', scope: ['user', 'admin'] } as never);
    const { fn } = mockFetch([
      [/\/commands\/foo\/(bar|baz)\/tags$/, () => []],
      [/\/commands\/foo\/bar$/, () => [cmd('foo', 'bar', '1.0.0')]],
      [/\/commands\/foo\/baz$/, () => [cmd('foo', 'baz', '1.0.0')]],
      [/\/users\/settings$/, () => ({})]
    ]);
    const { router } = await renderFeature(createRoutes, '/commands/foo/bar');

    await screen.findByText('bar desc');
    await act(() => router.navigate({ to: '/commands/foo/baz' }));
    await screen.findByText('baz desc');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await act(async () => router.history.back());
    await screen.findByText('bar desc');

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(fn.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(false);
  });

  it('drops a failed action alert when Back moves to another command', async () => {
    getSession().set({ token: 't', username: 'admin', scope: ['user', 'admin'] } as never);
    const { fn } = mockFetch([
      [/\/commands\/foo\/(bar|baz)\/tags$/, () => []],
      [/\/commands\/foo\/bar$/, () => [cmd('foo', 'bar', '1.0.0')]],
      [/\/commands\/foo\/baz$/, (_url, init) => (init?.method === 'DELETE' ? 403 : [cmd('foo', 'baz', '1.0.0')])],
      [/\/users\/settings$/, () => ({})]
    ]);
    const { router } = await renderFeature(createRoutes, '/commands/foo/bar');

    await screen.findByText('bar desc');
    await act(() => router.navigate({ to: '/commands/foo/baz' }));
    await screen.findByText('baz desc');
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Confirm' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(fn.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true);

    await act(async () => router.history.back());
    await screen.findByText('bar desc');

    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows not found when the command has no versions', async () => {
    routes();
    await renderFeature(createRoutes, '/commands/foo/missing');
    expect(await screen.findByText('Command not found')).toBeInTheDocument();
  });

  it('renders Japanese', async () => {
    routes();
    await renderFeature(createRoutes, '/commands', { locale: 'ja' });
    expect(await screen.findByText('bar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('コマンドを検索')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search commands')).toBeNull();
  });
});
