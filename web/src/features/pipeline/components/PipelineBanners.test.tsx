import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import { PipelineBanners } from './PipelineBanners';

afterEach(() => vi.unstubAllGlobals());

describe('PipelineBanners', () => {
  it('requests pipeline and global banners and shows the pipeline ones first, sanitized', async () => {
    const { calls } = mockFetch([
      [
        /\/banners$/,
        url =>
          url.searchParams.get('scope') === 'PIPELINE'
            ? [{ id: 1, message: 'Pipeline <b>frozen</b><script>x()</script>' }]
            : [{ id: 2, message: 'Global maintenance' }]
      ]
    ]);

    renderWithProviders(<PipelineBanners pipelineId={7} />);

    expect(await screen.findByText('frozen')).toBeInTheDocument();
    expect(document.querySelector('#banner script')).toBeNull();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    const queries = calls.map(c =>
      Object.fromEntries(new URLSearchParams(c.search))
    );

    expect(queries).toEqual(
      expect.arrayContaining([
        { isActive: 'true', scope: 'PIPELINE', scopeId: '7' },
        { isActive: 'true', scope: 'GLOBAL' }
      ])
    );

    await userEvent.click(screen.getByRole('button', { name: 'Next banner' }));
    expect(screen.getByText('Global maintenance')).toBeInTheDocument();
    expect(screen.getByText('2 of 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next banner' }));
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders nothing without banners and hides the arrows for a single banner', async () => {
    mockFetch([
      [
        /\/banners$/,
        url =>
          url.searchParams.get('scope') === 'GLOBAL'
            ? [{ id: 2, message: 'Only one' }]
            : []
      ]
    ]);
    renderWithProviders(<PipelineBanners pipelineId={7} />);

    expect(await screen.findByText('Only one')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next banner' })).toBeNull();
  });
});
