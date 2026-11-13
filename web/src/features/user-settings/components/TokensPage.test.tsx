import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { TokensPage } from './TokensPage';

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

const tokens = [
  {
    id: 1,
    name: 'ci',
    description: 'for ci',
    lastUsed: null,
    expiresAt: null,
    options: { permission: 'read' }
  }
];
const render = () =>
  renderPage(TokensPage, {
    path: '/user-settings/access-tokens',
    url: '/user-settings/access-tokens'
  });

describe('TokensPage', () => {
  it('lists tokens', async () => {
    mockApi({ 'GET /tokens': () => tokens });
    render();

    expect(await screen.findByText('ci')).toBeInTheDocument();
    expect(screen.getByText('No expiration')).toBeInTheDocument();
    expect(screen.getByText('Never used')).toBeInTheDocument();
  });

  it('sorts, filters and shows relative times', async () => {
    const day = 86_400_000;

    mockApi({
      'GET /tokens': () => [
        ...tokens,
        {
          id: 2,
          name: 'deploy',
          description: 'prod',
          lastUsed: new Date(Date.now() - 2 * day).toISOString(),
          expiresAt: new Date(Date.now() + 3 * day + 60_000).toISOString()
        },
        {
          id: 3,
          name: 'old',
          expiresAt: new Date(Date.now() - day).toISOString()
        }
      ]
    });
    render();

    expect(await screen.findByText('in 3 days')).toBeInTheDocument();
    expect(screen.getByText('2 days ago')).toBeInTheDocument();
    expect(
      screen.getByRole('cell', { name: 'This token has expired' })
    ).toHaveClass('text-danger');
    const names = () =>
      screen
        .getAllByRole('row')
        .slice(1)
        .map(row => within(row).getAllByRole('cell')[0]?.textContent);

    expect(names()).toEqual(['ci', 'deploy', 'old']);
    await userEvent.click(screen.getByRole('button', { name: /^Name/ }));
    expect(names()).toEqual(['old', 'deploy', 'ci']);
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Filter tokens' }),
      'prod'
    );
    expect(names()).toEqual(['deploy']);
  });

  it('creates a token and shows its value once', async () => {
    const { calls } = mockApi({
      'GET /tokens': () => tokens,
      'POST /tokens': () => ({ id: 2, name: 'new', value: 'SECRET-VALUE' })
    });

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'New Token' })
    );
    const dialog = await screen.findByRole('dialog');
    const create = within(dialog).getByRole('button', { name: 'Create token' });

    expect(create).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Name'), 'ci');
    expect(
      within(dialog).getByText('A token with this name already exists.')
    ).toBeInTheDocument();
    expect(create).toBeDisabled();

    await userEvent.clear(within(dialog).getByLabelText('Name'));
    await userEvent.type(within(dialog).getByLabelText('Name'), 'new');
    await userEvent.click(create);

    expect(await within(dialog).findByText('SECRET-VALUE')).toBeInTheDocument();
    const post = calls.find(c => c.method === 'POST')!;

    expect(post.body).toMatchObject({
      name: 'new',
      options: { permission: 'read' }
    });
  });

  it('edits a token', async () => {
    const { calls } = mockApi({
      'GET /tokens': () => tokens,
      'PUT /tokens/:id': () => ({})
    });

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Edit token ci' })
    );
    const dialog = await screen.findByRole('dialog');
    const name = within(dialog).getByLabelText('Name');

    await userEvent.clear(name);
    await userEvent.type(name, 'ci2');
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Update token' })
    );

    await waitFor(() => expect(calls.some(c => c.method === 'PUT')).toBe(true));
    const put = calls.find(c => c.method === 'PUT')!;

    expect(put.path).toBe('/tokens/1');
    expect(put.body).toMatchObject({ name: 'ci2' });
    expect(put.body).not.toHaveProperty('expiresAt');
    expect(put.body).not.toHaveProperty('options');
  });

  it('sends a changed permission', async () => {
    const { calls } = mockApi({
      'GET /tokens': () => tokens,
      'PUT /tokens/:id': () => ({})
    });

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Edit token ci' })
    );
    const dialog = await screen.findByRole('dialog');

    await userEvent.selectOptions(
      within(dialog).getByLabelText('Permission'),
      'write'
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Update token' })
    );

    await waitFor(() => expect(calls.some(c => c.method === 'PUT')).toBe(true));
    expect(calls.find(c => c.method === 'PUT')!.body).toMatchObject({
      options: { permission: 'write' }
    });
  });

  it('refreshes a token and shows the new value', async () => {
    const { calls } = mockApi({
      'GET /tokens': () => tokens,
      'PUT /tokens/:id/refresh': () => ({
        id: 1,
        name: 'ci',
        value: 'NEW-VALUE'
      })
    });

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Refresh token ci' })
    );
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Refresh token' })
    );

    expect(await within(dialog).findByText('NEW-VALUE')).toBeInTheDocument();
    const refreshCall = calls.find(c => c.path === '/tokens/1/refresh');

    expect(refreshCall).toBeTruthy();
    // Leave the expiry unchanged unless the user picks one.
    expect(refreshCall?.body ?? {}).not.toHaveProperty('expiresAt');
  });

  it('stays open while a refresh is in flight, so the one-time value is not lost', async () => {
    const { fn } = mockApi({ 'GET /tokens': () => tokens });
    let release!: () => void;
    const gate = new Promise<void>(resolve => (release = resolve));

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).includes('/refresh')) {
          await gate;

          return new Response(
            JSON.stringify({ id: 1, name: 'ci', value: 'NEW-VALUE' })
          );
        }

        return fn(input, init);
      })
    );
    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Refresh token ci' })
    );
    const dialog = await screen.findByRole('dialog');

    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Refresh token' })
    );
    await waitFor(() =>
      expect(
        within(dialog).getByRole('button', { name: 'Cancel' })
      ).toBeDisabled()
    );
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' })
    );
    await userEvent.keyboard('{Escape}');
    expect(screen.getByRole('dialog')).toBe(dialog);

    release();
    expect(await within(dialog).findByText('NEW-VALUE')).toBeInTheDocument();
  });

  it('requires typing the name to delete', async () => {
    const { calls } = mockApi({
      'GET /tokens': () => tokens,
      'DELETE /tokens/:id': () => ({})
    });

    render();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete token ci' })
    );
    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete token'
    });

    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Token name'), 'ci');
    await userEvent.click(confirm);

    await waitFor(() =>
      expect(
        calls.some(c => c.method === 'DELETE' && c.path === '/tokens/1')
      ).toBe(true)
    );
  });
});
