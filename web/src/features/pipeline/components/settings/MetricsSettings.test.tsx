import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi } from '~/test/page';
import { renderWithProviders } from '~/test/render';
import { signIn, signOut } from '~/test/session';
import type { Pipeline } from '../../types';
import { MetricsSettings } from './MetricsSettings';

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

const render = (metricsDowntimeJobs: number[]) => {
  const { calls } = mockApi({
    'GET /pipelines/:id/jobs': () => [
      { id: 11, name: 'main', pipelineId: 1, state: 'ENABLED' },
      { id: 12, name: 'test', pipelineId: 1, state: 'ENABLED' }
    ],
    'PUT /pipelines/:id': () => ({})
  });
  const pipeline = {
    id: 1,
    state: 'ACTIVE',
    settings: { metricsDowntimeJobs }
  } as Pipeline;

  renderWithProviders(<MetricsSettings pipeline={pipeline} />);

  return calls;
};

describe('MetricsSettings', () => {
  it('will not exclude the last included job, which would count every job again', async () => {
    const calls = render([11]);

    await userEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Include main in downtime metrics'
      })
    );
    const dialog = await screen.findByRole('dialog');

    expect(
      within(dialog).getByText(/At least one job must stay included/)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Exclude' })
    ).toBeDisabled();
    expect(calls.filter(c => c.method === 'PUT')).toEqual([]);
  });

  it('excludes a job while another stays included', async () => {
    const calls = render([11, 12]);

    await userEvent.click(
      await screen.findByRole('checkbox', {
        name: 'Include main in downtime metrics'
      })
    );
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Exclude'
      })
    );

    await waitFor(() =>
      expect(calls.filter(c => c.method === 'PUT').map(c => c.body)).toEqual([
        { settings: { metricsDowntimeJobs: [12] } }
      ])
    );
  });
});
