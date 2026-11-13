import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetch } from '~/test/feature-router';
import { renderWithProviders } from '~/test/render';
import type { Build, Pipeline, SdEvent } from '../../types';
import { deriveCardState, EventCard } from './EventCard';

const navigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useNavigate: () => navigate
}));

const event = {
  id: 42,
  pipelineId: 1,
  groupEventId: 42,
  type: 'pipeline',
  sha: 'abcdef1234567890',
  createTime: '2020-01-01T00:00:00Z',
  creator: { name: 'Bruce', username: 'batman' },
  commit: {
    message: 'Fix the thing',
    author: { name: 'Bruce', username: 'batman' },
    url: 'https://x/c'
  }
} as SdEvent;
const pipeline = { id: 1, state: 'ACTIVE' } as Pipeline;
const b = (id: number, status: string): Build => ({
  id,
  jobId: id,
  status,
  createTime: '2020-01-01T00:00:00Z'
});

describe('deriveCardState', () => {
  it('reports a running event with its counts', () => {
    const state = deriveCardState(
      event,
      [b(1, 'SUCCESS'), b(2, 'RUNNING')],
      undefined,
      new Set()
    );

    expect(state.status).toBe('RUNNING');
    expect(state.complete).toBe(false);
    expect(state.successes).toBe(1);
  });

  it('aggregates failures over the status color', () => {
    const state = deriveCardState(
      event,
      [b(1, 'SUCCESS'), b(2, 'FAILURE')],
      undefined,
      new Set()
    );

    expect(state.complete).toBe(true);
    expect(state.aggregateStatus).toBe('FAILURE');
  });

  it('treats [skip ci] commits without builds as skipped and complete', () => {
    const skipped = {
      ...event,
      commit: { ...event.commit, message: 'x [skip ci]' }
    } as SdEvent;
    const state = deriveCardState(skipped, [], undefined, new Set());

    expect(state.skipped).toBe(true);
    expect(state.status).toBe('SKIPPED');
    expect(state.complete).toBe(true);
  });
});

describe('<EventCard />', () => {
  beforeEach(() => {
    mockFetch([
      [/\/events\/42\/builds$/, () => [b(1, 'SUCCESS')]],
      [/\/pipelines\/1\/jobs$/, () => []],
      [/\/users\/settings$/, () => ({})]
    ]);
  });

  it('exposes the rail DOM contract and highlights the selected event', async () => {
    renderWithProviders(
      <EventCard pipeline={pipeline} event={event} selectedId={42} />
    );

    const card = screen.getByTitle('Event: 42');

    expect(card).toHaveAttribute('aria-current', 'true');
    expect(card).toHaveClass('highlighted');
    expect(screen.getByText('Fix the thing')).toBeInTheDocument();
    expect(await screen.findByTitle('Successes')).toBeInTheDocument();
  });

  it('is not highlighted when another event is selected', () => {
    renderWithProviders(
      <EventCard pipeline={pipeline} event={event} selectedId={7} />
    );

    expect(screen.getByTitle('Event: 42')).not.toHaveAttribute('aria-current');
    expect(screen.getByTitle('Event: 42')).not.toHaveClass('highlighted');
  });

  it('opens the event from the keyboard through its event id link', async () => {
    const onSelect = vi.fn();

    navigate.mockClear();
    renderWithProviders(
      <EventCard
        pipeline={pipeline}
        event={event}
        selectedId={7}
        onSelect={onSelect}
      />
    );
    const link = screen.getByRole('link', { name: /42/ });

    expect(link).toHaveAttribute('href', '/v2/pipelines/1/events/42');
    link.focus();
    await userEvent.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(event);
    expect(navigate).toHaveBeenCalledWith({ to: '/v2/pipelines/1/events/42' });
  });
});
