import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach } from 'vitest';
import { mockApi, renderPage } from '~/test/page';
import { signIn, signOut } from '~/test/session';
import { PreferencesPage } from './PreferencesPage';

beforeEach(() => signIn());
afterEach(() => {
  signOut();
  vi.unstubAllGlobals();
});

const render = () =>
  renderPage(PreferencesPage, {
    path: '/user-settings/preferences',
    url: '/user-settings/preferences'
  });

describe('PreferencesPage', () => {
  it('loads saved settings and saves changes while keeping keys it does not edit', async () => {
    const { calls } = mockApi({
      'GET /users/settings': () => ({
        displayJobNameLength: 30,
        timestampFormat: 'UTC',
        allowNotification: false,
        '123': { showPRJobs: false }
      }),
      'PUT /users/settings': () => ({})
    });

    render();
    const format = await screen.findByLabelText('Timestamp format');

    await waitFor(() => expect(format).toHaveValue('UTC'));

    await userEvent.selectOptions(format, 'LOCAL_TIMEZONE');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(
      await screen.findByText('User settings updated successfully!')
    ).toBeInTheDocument();
    const put = calls.find(c => c.method === 'PUT')!;

    expect(put.body).toEqual({
      settings: {
        displayJobNameLength: 30,
        timestampFormat: 'LOCAL_TIMEZONE',
        allowNotification: false,
        '123': { showPRJobs: false }
      }
    });
  });

  it('saves only what changed, keeping a value changed in another tab', async () => {
    let server: Record<string, unknown> = {
      timestampFormat: 'UTC',
      allowNotification: false
    };
    const { calls } = mockApi({
      'GET /users/settings': () => server,
      'PUT /users/settings': () => ({})
    });

    render();
    const format = await screen.findByLabelText('Timestamp format');

    await waitFor(() => expect(format).toHaveValue('UTC'));
    // Another tab switches to local time; this page still shows UTC.
    server = { timestampFormat: 'LOCAL_TIMEZONE', allowNotification: false };
    await userEvent.click(screen.getByLabelText('Enable browser notification'));

    await waitFor(() => expect(calls.some(c => c.method === 'PUT')).toBe(true));
    expect(calls.find(c => c.method === 'PUT')!.body).toEqual({
      settings: { timestampFormat: 'LOCAL_TIMEZONE', allowNotification: true }
    });
  });

  it('resets settings', async () => {
    const { calls } = mockApi({
      'GET /users/settings': () => ({ displayJobNameLength: 40 }),
      'DELETE /users/settings': () => ({})
    });

    render();
    await userEvent.click(await screen.findByRole('button', { name: 'Reset' }));

    expect(
      await screen.findByText('User settings reset successfully!')
    ).toBeInTheDocument();
    expect(calls.some(c => c.method === 'DELETE')).toBe(true);
  });
});
