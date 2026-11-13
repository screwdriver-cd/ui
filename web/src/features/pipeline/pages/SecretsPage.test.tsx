import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from '../routes';

const child = {
  id: 2,
  name: 'foo/child',
  scmRepo: { name: 'foo/child', branch: 'main', url: 'https://x' },
  state: 'ACTIVE',
  configPipelineId: 1
};
const parentSecrets = [
  { id: 10, pipelineId: 1, name: 'SHARED', allowInPR: false },
  { id: 11, pipelineId: 1, name: 'OVERRIDDEN', allowInPR: false }
];
// The API's child list includes the parent's secrets merged with this pipeline's own.
const childSecrets = [
  { id: 10, pipelineId: 1, name: 'SHARED', allowInPR: false },
  { id: 20, pipelineId: 2, name: 'OVERRIDDEN', allowInPR: true },
  { id: 21, pipelineId: 2, name: 'OWN', allowInPR: false }
];

type Fn = ReturnType<typeof mockFetch>['fn'];

const call = (fn: Fn, method: string) =>
  fn.mock.calls.find(([, init]) => init?.method === method);

function setup(secrets = childSecrets) {
  return mockFetch([
    [/\/pipelines\/2\/secrets$/, () => secrets],
    [/\/pipelines\/1\/secrets$/, () => parentSecrets],
    [/\/secrets(\/\d+)?$/, (_u, init) => ({ id: 30, ...JSON.parse((init?.body as string) ?? '{}') })],
    [/\/pipelines\/2$/, () => child]
  ]);
}

const row = (name: string) =>
  screen.getByRole('row', { name: new RegExp(`^${name}`) });

describe('pipeline secrets', () => {
  beforeEach(() => signIn());

  it('merges inherited secrets into one table with the docs and parent links', async () => {
    setup();
    await renderFeature(createRoutes, '/v2/pipelines/2/secrets');
    await screen.findByRole('row', { name: /^SHARED/ });

    expect(screen.getByText('Secrets must also be added to the Screwdriver YAML.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Secrets documentation' })).toHaveAttribute(
      'href',
      'https://docs.screwdriver.cd/user-guide/configuration/secrets'
    );
    expect(screen.getByRole('link', { name: 'Inherited secrets' })).toHaveAttribute(
      'href',
      '/v2/pipelines/1/secrets'
    );

    // Inherited only: override, no delete.
    expect(within(row('SHARED')).getByRole('button', { name: 'Override SHARED' })).toBeInTheDocument();
    expect(within(row('SHARED')).queryByRole('button', { name: /delete|revert/i })).toBeNull();
    // Overridden: edit and revert.
    expect(within(row('OVERRIDDEN')).getByRole('button', { name: 'Edit OVERRIDDEN' })).toBeInTheDocument();
    expect(within(row('OVERRIDDEN')).getByRole('button', { name: 'Revert OVERRIDDEN' })).toBeInTheDocument();
    // Own: edit and delete.
    expect(within(row('OWN')).getByRole('button', { name: 'Delete OWN' })).toBeInTheDocument();
  });

  it('closes a secret dialog when Back leaves the pipeline it was opened on', async () => {
    const { fn } = mockFetch([
      [/\/pipelines\/2\/secrets$/, () => childSecrets],
      [/\/pipelines\/1\/secrets$/, () => parentSecrets],
      [/\/pipelines\/2$/, () => child],
      [/\/pipelines\/1$/, () => ({ ...child, id: 1, name: 'foo/parent', configPipelineId: undefined })]
    ]);
    const { router } = await renderFeature(createRoutes, '/v2/pipelines/2/secrets');

    await userEvent.click(await screen.findByRole('link', { name: 'Inherited secrets' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add secret' }));
    await userEvent.type(within(await screen.findByRole('dialog')).getByLabelText('Value'), 'parent-only');

    await act(async () => router.history.back());
    await screen.findByRole('row', { name: /^OWN/ });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(call(fn, 'POST')).toBeUndefined();
  });

  it('editing only the value leaves the allow-in-PR flag alone', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/2/secrets');
    await userEvent.click(await screen.findByRole('button', { name: 'Edit OWN' }));

    const dialog = await screen.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText('Value'), 'v');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(call(fn, 'PUT')).toBeDefined());
    expect(String(call(fn, 'PUT')?.[0])).toMatch(/\/secrets\/21$/);
    expect(JSON.parse(call(fn, 'PUT')?.[1]?.body as string)).toEqual({ value: 'v' });
  });

  it('overriding an inherited secret creates one on this pipeline', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/2/secrets');
    await userEvent.click(await screen.findByRole('button', { name: 'Override SHARED' }));

    const dialog = await screen.findByRole('dialog');
    const confirm = within(dialog).getByRole('button', { name: 'Override' });

    expect(confirm).toBeDisabled();
    await userEvent.type(within(dialog).getByLabelText('Value'), 'v');
    await userEvent.click(confirm);
    await vi.waitFor(() => expect(call(fn, 'POST')).toBeDefined());
    expect(String(call(fn, 'POST')?.[0])).toMatch(/\/secrets$/);
    expect(JSON.parse(call(fn, 'POST')?.[1]?.body as string)).toEqual({
      pipelineId: 2,
      name: 'SHARED',
      value: 'v',
      allowInPR: false
    });
  });

  it('reverting an override deletes this pipeline\'s value after confirming the name', async () => {
    const { fn } = setup();

    await renderFeature(createRoutes, '/v2/pipelines/2/secrets');
    await userEvent.click(await screen.findByRole('button', { name: 'Revert OVERRIDDEN' }));

    const dialog = await screen.findByRole('dialog');

    expect(within(dialog).getByText('Reverts the secret value to the inherited value.')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByRole('textbox'), 'OVERRIDDEN');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revert' }));
    await vi.waitFor(() => expect(String(call(fn, 'DELETE')?.[0])).toMatch(/\/secrets\/20$/));
  });

  it('filters by key and inherited, sorts and pages', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({
      id: 100 + i,
      pipelineId: 2,
      name: `K${String(i).padStart(2, '0')}`,
      allowInPR: false
    }));

    setup([...childSecrets, ...many]);
    await renderFeature(createRoutes, '/v2/pipelines/2/secrets');
    await screen.findByRole('row', { name: /^K00/ });

    expect(screen.getByText('Show 1 - 10 of 15')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    expect(screen.getByRole('row', { name: /^SHARED/ })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^key/i }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('SHARED');

    await userEvent.type(screen.getByLabelText('Filter by Key'), 'over');
    expect(screen.getByText('Show 1 - 1 of 1')).toBeInTheDocument();
    expect(row('OVERRIDDEN')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Filter by Key'));
    await userEvent.selectOptions(screen.getByLabelText('Filter by Inherited'), 'yes');
    expect(screen.getByText('Show 1 - 2 of 2')).toBeInTheDocument();
  });
});
