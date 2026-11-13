import { screen } from '@testing-library/react';
import { mockFetch, renderFeature, signIn } from '~/test/feature-router';
import { createRoutes } from './routes';

const pipeline = {
  id: 1,
  name: 'foo/bar',
  scmRepo: { name: 'foo/bar', branch: 'main', url: 'https://x' },
  state: 'ACTIVE'
};

describe('pipeline routes', () => {
  beforeEach(() => {
    signIn();
    mockFetch([
      [/\/pipelines\/1$/, () => pipeline],
      [
        /\/pipelines\/1\/secrets$/,
        () => [{ id: 1, name: 'BATMAN', allowInPR: false }]
      ],
      [
        /\/pipelines\/1\/tokens$/,
        () => [{ id: 2, name: 'robin-token', description: 'for robin' }]
      ],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/users\/settings$/, () => ({})]
    ]);
  });

  it('renders the header, tabs and the secrets page', async () => {
    await renderFeature(createRoutes, '/v2/pipelines/1/secrets');

    expect(await screen.findByText('BATMAN')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'foo/bar' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Pipeline sections' })
    ).toBeInTheDocument();
  });

  it('serves tokens at /tokens', async () => {
    await renderFeature(createRoutes, '/v2/pipelines/1/tokens');
    expect(await screen.findByText('robin-token')).toBeInTheDocument();
  });

  it('redirects /options to settings', async () => {
    const { router } = await renderFeature(
      createRoutes,
      '/v2/pipelines/1/options'
    );

    expect(router.state.location.pathname).toBe('/v2/pipelines/1/settings');
  });

  it.each([
    ['/pipelines/1', '/v2/pipelines/1/events'],
    ['/pipelines/1/events/7', '/v2/pipelines/1/events/7'],
    ['/pipelines/1/options', '/v2/pipelines/1/settings'],
    ['/pipelines/1/pulls', '/v2/pipelines/1/pulls'],
    ['/pipelines/1/child-pipelines', '/v2/pipelines/1/child-pipelines'],
    ['/v2', '/']
  ])('redirects the v1 URL %s to %s', async (from, to) => {
    const { router } = await renderFeature(createRoutes, from);

    expect(router.state.location.pathname).toBe(to);
  });

  it('keeps the query string when redirecting a v1 URL', async () => {
    const { router } = await renderFeature(
      createRoutes,
      '/pipelines/1/events?jobId=3'
    );

    expect(router.state.location.pathname).toBe('/v2/pipelines/1/events');
    expect(
      String((router.state.location.search as { jobId?: unknown }).jobId)
    ).toBe('3');
  });

  it('renders in Japanese', async () => {
    await renderFeature(createRoutes, '/v2/pipelines/1/secrets', {
      locale: 'ja'
    });
    expect(await screen.findByText('シークレットを追加')).toBeInTheDocument();
  });
});
