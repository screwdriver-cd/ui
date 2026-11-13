import { fireEvent, screen, waitFor } from '@testing-library/react';
import { mockApi } from '~/test/page';
import { renderWithProviders } from '~/test/render';
import { signIn, signOut } from '~/test/session';
import type { Pipeline } from '../../types';
import { PreferencesSettings } from './PreferencesSettings';

const pipeline = {
  id: 1,
  state: 'ACTIVE',
  settings: { showEventTriggers: false, filterSchedulerEvents: false }
} as Pipeline;

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

describe('PreferencesSettings', () => {
  it('locks every control while a save is in flight, so one change cannot undo another', async () => {
    const { calls } = mockApi({
      'GET /users/settings': () => ({}),
      'PUT /pipelines/:id': () => pipeline
    });

    renderWithProviders(<PreferencesSettings pipeline={pipeline} />);
    const triggers = screen.getByRole('checkbox', {
      name: 'Toggle show triggers in pipeline graph'
    });
    const scheduler = screen.getByRole('checkbox', {
      name: 'Toggle filtering of scheduler events'
    });

    await waitFor(() => expect(scheduler).toBeEnabled());
    fireEvent.click(triggers);

    expect(scheduler).toBeDisabled();
    expect(
      screen.getByRole('combobox', { name: 'Timestamp format' })
    ).toBeDisabled();

    await waitFor(() => expect(scheduler).toBeEnabled());
    expect(calls.filter(c => c.method === 'PUT').map(c => c.body)).toEqual([
      { settings: { showEventTriggers: true } }
    ]);
  });

  it('does not resend a cached visibility another tab has since changed', async () => {
    const { calls } = mockApi({
      'GET /users/settings': () => ({}),
      'PUT /pipelines/:id': () => pipeline
    });
    const stale = {
      ...pipeline,
      settings: { ...pipeline.settings, public: true }
    } as Pipeline;

    renderWithProviders(<PreferencesSettings pipeline={stale} />);
    const scheduler = screen.getByRole('checkbox', {
      name: 'Toggle filtering of scheduler events'
    });

    await waitFor(() => expect(scheduler).toBeEnabled());
    fireEvent.click(scheduler);

    await waitFor(() =>
      expect(calls.filter(c => c.method === 'PUT').map(c => c.body)).toEqual([
        { settings: { filterSchedulerEvents: true } }
      ])
    );
  });
});
