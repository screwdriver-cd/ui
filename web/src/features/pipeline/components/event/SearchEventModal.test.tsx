import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getSession } from '~/auth/session';
import { mockFetch, signIn } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import { mockVirtualList } from '../../test-utils';
import type { Pipeline, SdEvent } from '../../types';
import { SearchEventModal } from './SearchEventModal';

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useNavigate: () => vi.fn()
}));

const pipeline = { id: 1, state: 'ACTIVE' } as Pipeline;
const make = (id: number, message = `Commit ${id}`) =>
  ({
    id,
    pipelineId: 1,
    groupEventId: id,
    type: 'pipeline',
    sha: id.toString(16).padStart(40, '0'),
    createTime: '2020-01-01T00:00:00Z',
    creator: { name: 'Bruce', username: 'batman' },
    commit: { message, author: { name: 'Bruce', username: 'batman' } }
  } as SdEvent);

const isSearch = (c: { path: string }) =>
  /\/pipelines\/1\/events$/.test(c.path);
const param = (c: { search: string }, name: string) =>
  new URLSearchParams(c.search).get(name);

function render(onClose = vi.fn(), isPr = false) {
  return renderWithProviders(
    <SearchEventModal
      pipeline={pipeline}
      isPr={isPr}
      debounceMs={0}
      onClose={onClose}
    />
  );
}

describe('SearchEventModal', () => {
  beforeEach(() => {
    mockVirtualList(800, 600, 40);
    signIn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    getSession().set(null);
  });

  it('reports a failed search with a retry instead of "no results"', async () => {
    let fail = true;

    mockFetch([
      [/\/pipelines\/1\/events$/, () => (fail ? 500 : [make(7, 'fix the flaky test')])],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/events\/\d+\/builds$/, () => []]
    ]);
    render();
    await userEvent.type(screen.getByRole('searchbox'), 'flaky');

    expect(await screen.findByText('Something went wrong.')).toBeInTheDocument();
    expect(screen.queryByText(/no results/i)).toBeNull();
    fail = false;
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('fix the flaky test')).toBeInTheDocument();
  });

  it('searches by the chosen field with the type and paging the API expects', async () => {
    const { calls } = mockFetch([
      [/\/pipelines\/1\/events$/, () => [make(7, 'fix the flaky test')]],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/events\/\d+\/builds$/, () => []]
    ]);

    render();
    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(calls.filter(isSearch)).toHaveLength(0);

    await userEvent.click(screen.getByLabelText('Search term'));
    await userEvent.paste('flaky');
    expect(await screen.findByText('fix the flaky test')).toBeInTheDocument();
    const call = calls.find(isSearch);

    expect(Object.fromEntries(new URLSearchParams(call?.search))).toEqual({
      message: 'flaky',
      type: 'pipeline',
      page: '1',
      count: '10'
    });

    await userEvent.selectOptions(
      screen.getByLabelText('Search by'),
      'creator'
    );
    await waitFor(() =>
      expect(calls.some(c => param(c, 'creator') === 'flaky')).toBe(true)
    );
  });

  it('uses type=pr in PR mode', async () => {
    const { calls } = mockFetch([
      [/\/pipelines\/1\/events$/, () => [make(7)]],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/events\/\d+\/builds$/, () => []]
    ]);

    render(vi.fn(), true);
    await userEvent.type(screen.getByLabelText('Search term'), 'x');
    await waitFor(() =>
      expect(calls.some(c => param(c, 'type') === 'pr')).toBe(true)
    );
  });

  it('validates the sha locally and does not call the API for an invalid one', async () => {
    const { calls } = mockFetch([[/.*/, () => []]]);

    render();
    await userEvent.selectOptions(screen.getByLabelText('Search by'), 'sha');
    await userEvent.type(screen.getByLabelText('Search term'), 'xyz');

    expect(await screen.findByText(/Invalid SHA/)).toBeInTheDocument();
    expect(calls).toHaveLength(0);

    await userEvent.clear(screen.getByLabelText('Search term'));
    await userEvent.type(screen.getByLabelText('Search term'), 'abc123');
    await waitFor(() =>
      expect(calls.some(c => param(c, 'sha') === 'abc123')).toBe(true)
    );
    expect(screen.queryByText(/Invalid SHA/)).toBeNull();
  });

  it('loads the next page when the list reaches its end, and stops after a short page', async () => {
    const full = Array.from({ length: 10 }, (_, i) => make(i + 1));
    const { calls } = mockFetch([
      [
        /\/pipelines\/1\/events$/,
        url => (url.searchParams.get('page') === '1' ? full : [make(99)])
      ],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/events\/\d+\/builds$/, () => []]
    ]);

    render();
    await userEvent.click(screen.getByLabelText('Search term'));
    await userEvent.paste('commit');
    await waitFor(() =>
      expect(calls.filter(isSearch).map(c => param(c, 'page'))).toEqual([
        '1',
        '2'
      ])
    );
    // The second page was short: once it is on screen, nothing further is requested.
    expect(await screen.findByText('Commit 99')).toBeInTheDocument();
    expect(calls.filter(isSearch)).toHaveLength(2);
  });

  it('Escape clears the query first and closes the dialog on the next press', async () => {
    mockFetch([[/.*/, () => []]]);
    const onClose = vi.fn();

    render(onClose);
    const input = screen.getByLabelText('Search term');

    await userEvent.type(input, 'abc');
    await userEvent.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
