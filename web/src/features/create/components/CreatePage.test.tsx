import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { CreatePage } from './CreatePage';

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

const baseRoutes = {
  'GET /auth/contexts': () => [
    {
      context: 'github:github.com',
      displayName: 'github.com',
      autoDeployKeyGeneration: true
    }
  ]
};
const render = (extra: string[] = []) =>
  renderPage(CreatePage, {
    path: '/create',
    url: '/create',
    extraPaths: extra
  });

describe('CreatePage', () => {
  it('disables submit until the repo url looks valid and warns about bad urls', async () => {
    mockApi(baseRoutes);
    render();

    const submit = await screen.findByRole('button', {
      name: 'Create Pipeline'
    });
    const input = screen.getByLabelText('Repo Url');

    expect(submit).toBeDisabled();
    await userEvent.type(input, 'nope');
    expect(
      screen.getByText('This does not look like a supported repository URL.')
    ).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await userEvent.clear(input);
    await userEvent.type(input, 'git@github.com:a/b.git#main');
    expect(submit).toBeEnabled();
  });

  it('creates the pipeline and goes to it', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      'POST /pipelines': () => ({ id: 5 })
    });
    const { router } = render(['/v2/pipelines/5/events']);

    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git#main'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Pipeline' })
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/v2/pipelines/5/events')
    );
    expect(calls.find(c => c.method === 'POST')!.body).toEqual({
      checkoutUrl: 'git@github.com:a/b.git#main',
      rootDir: '',
      autoKeysGeneration: false
    });
  });

  it('sends rootDir and auto keys when chosen', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      'POST /pipelines': () => ({ id: 5 })
    });

    render(['/v2/pipelines/5/events']);
    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git'
    );
    await userEvent.click(
      screen.getByLabelText('My source directory is not at the checkout root')
    );
    await userEvent.type(screen.getByLabelText('Source directory'), 'src');
    await userEvent.click(
      await screen.findByLabelText(
        'Generate deploy key pair automatically and add to pipeline.'
      )
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Pipeline' })
    );

    await waitFor(() =>
      expect(calls.some(c => c.method === 'POST')).toBe(true)
    );
    expect(calls.find(c => c.method === 'POST')!.body).toMatchObject({
      rootDir: 'src',
      autoKeysGeneration: true
    });
  });

  it('goes to the existing pipeline on a 409', async () => {
    mockApi({
      ...baseRoutes,
      'POST /pipelines': () => [
        409,
        { message: 'exists', data: { existingId: 77 } }
      ]
    });
    const { router } = render(['/v2/pipelines/77/events']);

    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Pipeline' })
    );

    await waitFor(() =>
      expect(router.state.location.pathname).toBe('/v2/pipelines/77/events')
    );
  });

  it('shows the API error message', async () => {
    mockApi({
      ...baseRoutes,
      'POST /pipelines': () => [500, { message: 'scm exploded' }]
    });
    render();

    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Pipeline' })
    );

    expect(await screen.findByText('scm exploded')).toBeInTheDocument();
  });

  it('opens an onboarding PR, in the source directory, when a template is chosen', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      'GET /templates': () => [
        { name: 'node', namespace: 'ci', trusted: true },
        { name: 'other', namespace: 'ci', trusted: false }
      ],
      'POST /validator': () => ({ jobs: {} }),
      'POST /pipelines': () => ({ id: 9, scmRepo: { branch: 'main' } }),
      'POST /pipelines/9/openPr': () => ({
        prUrl: 'https://github.com/a/b/pull/1'
      })
    });

    render();
    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git'
    );
    await userEvent.click(
      screen.getByLabelText('My source directory is not at the checkout root')
    );
    await userEvent.type(
      screen.getByLabelText('Source directory'),
      'services/api'
    );
    await userEvent.click(
      screen.getByLabelText(
        'I choose a template to automatically generate the screwdriver.yaml'
      )
    );

    const select = await screen.findByLabelText('Template');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'node' })).toBeInTheDocument()
    );
    expect(
      screen.queryByRole('option', { name: 'other' })
    ).not.toBeInTheDocument();
    fireEvent.change(select, {
      target: {
        value: (
          screen.getByRole('option', { name: 'node' }) as HTMLOptionElement
        ).value
      }
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create Pipeline' })
    );

    expect(await screen.findByText('PR Created:')).toBeInTheDocument();
    const pr = calls.find(c => c.path === '/pipelines/9/openPr')!;

    expect(pr.body).toMatchObject({
      checkoutUrl: 'git@github.com:a/b.git#main',
      files: [{ name: 'services/api/screwdriver.yaml' }]
    });
    expect(JSON.stringify(pr.body)).toContain('template: ci/node');
  });

  it('retries just the onboarding PR when it failed after the pipeline was created', async () => {
    let prFails = true;
    const { calls } = mockApi({
      ...baseRoutes,
      'GET /templates': () => [
        { name: 'node', namespace: 'ci', trusted: true }
      ],
      'POST /validator': () => ({ jobs: {} }),
      'POST /pipelines': () => ({ id: 9, scmRepo: { branch: 'main' } }),
      'POST /pipelines/9/openPr': () => {
        if (prFails) {
          prFails = false;

          return [500, { message: 'GitHub is down' }];
        }

        return { prUrl: 'https://github.com/a/b/pull/1' };
      }
    });

    render();
    await userEvent.type(
      await screen.findByLabelText('Repo Url'),
      'git@github.com:a/b.git'
    );
    await userEvent.click(
      screen.getByLabelText(
        'I choose a template to automatically generate the screwdriver.yaml'
      )
    );
    const select = await screen.findByLabelText('Template');

    await waitFor(() =>
      expect(screen.getByRole('option', { name: 'node' })).toBeInTheDocument()
    );
    fireEvent.change(select, {
      target: {
        value: (
          screen.getByRole('option', { name: 'node' }) as HTMLOptionElement
        ).value
      }
    });
    const create = screen.getByRole('button', { name: 'Create Pipeline' });

    await userEvent.click(create);
    expect(await screen.findByText('GitHub is down')).toBeInTheDocument();
    await userEvent.click(create);

    expect(await screen.findByText('PR Created:')).toBeInTheDocument();
    expect(
      calls
        .filter(c => c.method === 'POST' && c.path.startsWith('/pipelines'))
        .map(c => c.path)
    ).toEqual(['/pipelines', '/pipelines/9/openPr', '/pipelines/9/openPr']);
  });
});
