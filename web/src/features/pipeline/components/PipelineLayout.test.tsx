import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from '../routes';

const base = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};

function render(pipeline: object) {
  mockFetch([
    [/\/pipelines\/1$/, () => ({ ...base, ...pipeline })],
    [/\/pipelines\/1\/secrets$/, () => []],
    [/\/pipelines\/1\/jobs$/, () => []],
    [/\/users\/settings$/, () => ({})]
  ]);

  return renderFeature(createRoutes, '/v2/pipelines/1/secrets');
}

describe('<PipelineLayout /> header', () => {
  beforeEach(() => signIn());
  afterEach(() => vi.unstubAllGlobals());

  it('explains who disabled the pipeline and why', async () => {
    await render({
      state: 'DISABLED',
      stateChanger: 'alice',
      stateChangeTime: new Date(Date.now() - 3 * 86_400_000).toISOString(),
      stateChangeMessage: 'migrating'
    });

    expect(
      await screen.findByText(/This pipeline is disabled/)
    ).toHaveTextContent(
      'This pipeline is disabled and new events will not be started. Disabled by alice 3 days ago. Reason: migrating.'
    );
  });

  it('shows the inactive notice, description and SonarQube link', async () => {
    await render({
      state: 'INACTIVE',
      annotations: { 'screwdriver.cd/pipelineDescription': 'Builds the UI' },
      badges: { sonar: { name: 'ui-proj', uri: 'https://sonar.example/ui' } }
    });

    expect(await screen.findByText(/Pipeline is inactive/)).toBeInTheDocument();
    expect(screen.getByText('Builds the UI')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'SonarQube project: ui-proj' })
    ).toHaveAttribute('href', 'https://sonar.example/ui');
  });

  it('shows none of them for a plain active pipeline', async () => {
    await render({});

    expect(
      await screen.findByRole('heading', { name: 'foo/bar' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/disabled|inactive/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /SonarQube/ })).toBeNull();
  });

  it('does not carry an "Added to" message over to another pipeline', async () => {
    mockFetch([
      [/\/pipelines\/(1|2)$/, url => ({ ...base, id: Number(url.pathname.split('/').pop()) })],
      [/\/pipelines\/\d+\/secrets$/, () => []],
      [/\/pipelines\/\d+\/jobs$/, () => []],
      [/\/collections\/5\/pipelines$/, () => ({})],
      [/\/collections$/, () => [{ id: 5, name: 'Foo', type: 'normal', pipelineIds: [] }]],
      [/\/users\/settings$/, () => ({})]
    ]);
    const { router } = await renderFeature(createRoutes, '/v2/pipelines/2/secrets');

    await screen.findByRole('button', { name: 'Add foo/bar to collection' });
    await act(() => router.navigate({ to: '/v2/pipelines/1/secrets' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Add foo/bar to collection' }));
    await userEvent.click(await screen.findByText('Foo'));
    expect(await screen.findByText('Added to Foo')).toBeInTheDocument();

    // Back to a pipeline already in the cache: the layout stays mounted.
    await act(async () => router.history.back());
    await waitFor(() => expect(router.state.location.pathname).toBe('/v2/pipelines/2/secrets'));

    expect(screen.queryByText('Added to Foo')).toBeNull();
  });
});
