import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { patchProperty } from '~/test/patch';
import { createRoutes } from '../routes';

const pipeline = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};
const future = new Date(Date.now() + 3 * 86400000).toISOString();
const tokens = [
  { id: 7, name: 'ci', description: '', expiresAt: '2020-01-01T00:00:00.000Z' },
  {
    id: 8,
    name: 'deploy',
    description: 'cd',
    expiresAt: future,
    lastUsed: new Date(Date.now() - 2 * 3600000).toISOString(),
    options: { permission: 'execute' }
  }
];

type Fn = ReturnType<typeof mockFetch>['fn'];

const bodyOf = (fn: Fn, method: string) => {
  const call = fn.mock.calls.find(([, init]) => init?.method === method);

  return JSON.parse((call?.[1]?.body as string) ?? '{}');
};

function setup() {
  return mockFetch([
    [/\/pipelines\/1\/tokens\/7\/refresh$/, () => ({ id: 7, name: 'ci', value: 'NEW' })],
    [/\/pipelines\/1\/tokens\/\d+$/, (_u, init) => ({ ...tokens[1], ...JSON.parse((init?.body as string) ?? '{}') })],
    [
      /\/pipelines\/1\/tokens$/,
      (_u, init) =>
        init?.method === 'POST' ? { id: 9, name: 'new', value: 'SECRETVALUE' } : tokens
    ],
    [/\/pipelines\/1$/, () => pipeline]
  ]);
}

describe('pipeline tokens table', () => {
  beforeEach(() => signIn());

  it('shows permission, expired state and relative times', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');

    const ci = await screen.findByRole('row', { name: /^ci/ });
    const deploy = screen.getByRole('row', { name: /^deploy/ });

    expect(within(ci).getByText('This token has expired')).toBeInTheDocument();
    expect(within(ci).getByText('all')).toBeInTheDocument();
    expect(within(ci).getByText('Never used')).toBeInTheDocument();
    expect(within(deploy).getByText('execute')).toBeInTheDocument();
    expect(within(deploy).getByText('in 3 days')).toBeInTheDocument();
    expect(within(deploy).getByText('2 hours ago')).toBeInTheDocument();
  });
});

describe('pipeline token create and edit', () => {
  beforeEach(() => signIn());

  it('creates with expiry and permission, then shows a copyable value', async () => {
    const { fn } = setup();
    const writeText = vi.fn(async () => undefined);

    patchProperty(navigator, 'clipboard', { value: { writeText } });
    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');
    await userEvent.click(await screen.findByRole('button', { name: /add token/i }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText('Name'), 'new');
    expect(within(dialog).getByLabelText<HTMLSelectElement>('Expires in').value).toBe('day1');
    expect(within(dialog).getByLabelText<HTMLSelectElement>('Permission').value).toBe('read');
    await userEvent.selectOptions(within(dialog).getByLabelText('Expires in'), 'never');
    await userEvent.selectOptions(within(dialog).getByLabelText('Permission'), 'write');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await screen.findByText('SECRETVALUE');
    expect(bodyOf(fn, 'POST')).toEqual({
      name: 'new',
      description: '',
      expiresAt: '',
      options: { permission: 'write' }
    });
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(writeText).toHaveBeenCalledWith('SECRETVALUE');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeDisabled();
  });

  it('rejects a duplicate name', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');
    await userEvent.click(await screen.findByRole('button', { name: /add token/i }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText('Name'), 'ci');
    expect(within(dialog).getByText('A token with this name already exists.')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('edit shows current values and only sends what changed', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');

    const deploy = await screen.findByRole('row', { name: /^deploy/ });

    await userEvent.click(within(deploy).getByRole('button', { name: /edit/i }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Current: execute')).toBeInTheDocument();
    expect(within(dialog).getByText(/^Current: /, { selector: '#token-current-expiry' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(bodyOf(fn, 'PUT')).toEqual({ name: 'deploy', description: 'cd' }));
  });

  it('edit sends a new permission and expiry', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');

    const deploy = await screen.findByRole('row', { name: /^deploy/ });

    await userEvent.click(within(deploy).getByRole('button', { name: /edit/i }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.selectOptions(within(dialog).getByLabelText('Permission'), 'read');
    await userEvent.selectOptions(within(dialog).getByLabelText('Expires in'), 'day30');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(bodyOf(fn, 'PUT').options).toEqual({ permission: 'read' }));
    expect(Date.parse(bodyOf(fn, 'PUT').expiresAt)).toBeGreaterThan(Date.now());
  });

  it('delete needs the token name', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');

    const ci = await screen.findByRole('row', { name: /^ci/ });

    await userEvent.click(within(ci).getByRole('button', { name: /delete/i }));

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Delete' });

    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByRole('textbox'), 'ci');
    await userEvent.click(confirm);
    await vi.waitFor(() =>
      expect(fn.mock.calls.some(([, init]) => init?.method === 'DELETE')).toBe(true)
    );
  });
});

describe('pipeline tokens refresh', () => {
  beforeEach(() => signIn());

  async function openRefresh() {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/1/secrets/tokens');

    const ci = await screen.findByRole('row', { name: /^ci/ });

    await userEvent.click(within(ci).getByRole('button', { name: /^refresh$/i }));

    return { fn, dialog: await screen.findByRole('dialog') };
  }

  it('sends a new expiry when one is chosen', async () => {
    const { fn, dialog } = await openRefresh();

    await userEvent.selectOptions(within(dialog).getByLabelText('Expires in'), 'day30');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Refresh' }));
    await screen.findByText('NEW', {}, { timeout: 5000 });

    expect(typeof bodyOf(fn, 'PUT').expiresAt).toBe('string');
    expect(Date.parse(bodyOf(fn, 'PUT').expiresAt)).toBeGreaterThan(Date.now());
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument();
  });

  it('leaves the expiry unchanged by default', async () => {
    const { fn, dialog } = await openRefresh();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Refresh' }));
    await screen.findByText('NEW', {}, { timeout: 5000 });

    expect(bodyOf(fn, 'PUT')).not.toHaveProperty('expiresAt');
  });
});
