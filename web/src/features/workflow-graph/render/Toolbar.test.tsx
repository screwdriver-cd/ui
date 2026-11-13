import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '~/test/render';
import type { DownstreamInPlay, Lens, Progress } from '../lens';
import { Toolbar, type ToolbarProps } from './Toolbar';

const progress = (
  counts: Partial<Omit<Progress, 'byState'>> = {}
): Progress => ({
  total: 0,
  done: 0,
  failed: 0,
  running: 0,
  queued: 0,
  pending: 0,
  wontRun: 0,
  byState: {
    done: [],
    failed: [],
    running: [],
    queued: [],
    pending: [],
    'wont-run': []
  },
  ...counts
});

const summary = (extra: Partial<DownstreamInPlay> = {}): DownstreamInPlay => ({
  running: [],
  queued: [],
  done: [],
  failed: [],
  waitingOnJoin: [],
  wontRun: [],
  pending: [],
  ...extra
});

const lens = (
  taken: string[],
  possible: string[] = [],
  inferred = false
): Lens => ({
  focus: 'deploy',
  upstream: {
    taken: new Set(taken),
    takenEdges: new Set(),
    possible: new Set(possible),
    possibleEdges: new Set(),
    inferred
  },
  downstream: summary(),
  tierOf: () => 'dimmed',
  edgeTierOf: () => 'dimmed'
});

function setup(
  overrides: Partial<ToolbarProps> = {},
  locale: 'en' | 'ja' = 'en'
) {
  const props: ToolbarProps = {
    query: '',
    onQuery: vi.fn(),
    matchCount: null,
    showLabels: true,
    onToggleLabels: vi.fn(),
    onFit: vi.fn(),
    onJump: vi.fn(),
    canJump: true,
    progress: progress(),
    stateFilter: null,
    onStateFilter: vi.fn(),
    pinned: null,
    onUnpin: vi.fn(),
    lens: null,
    lensSummary: null,
    event: true,
    ...overrides
  };
  const utils = renderWithProviders(<Toolbar {...props} />, { locale });

  return { props, ...utils };
}

describe('Toolbar search', () => {
  it('reports what is typed and shows the controlled query', () => {
    const { props } = setup({ query: 'dep' });
    const box = screen.getByRole('searchbox', { name: 'Search jobs' });

    expect(box).toHaveValue('dep');
    expect(box).toHaveAttribute('placeholder', 'Search jobs');
    fireEvent.change(box, { target: { value: 'deploy' } });
    expect(props.onQuery).toHaveBeenCalledWith('deploy');
  });

  it('shows the pluralised match count only while searching', () => {
    const { rerender, props } = setup();

    expect(screen.queryByText(/match/)).toBeNull();

    rerender(<Toolbar {...props} matchCount={0} />);
    expect(screen.getByText('No matches')).toBeInTheDocument();
    rerender(<Toolbar {...props} matchCount={1} />);
    expect(screen.getByText('1 match')).toBeInTheDocument();
    rerender(<Toolbar {...props} matchCount={4} />);
    expect(screen.getByText('4 matches')).toHaveAttribute('role', 'status');
  });
});

describe('Toolbar view buttons', () => {
  it('labels the label toggle by the action it performs and reflects the state in aria-pressed', () => {
    const { props, rerender } = setup({ showLabels: true });

    fireEvent.click(screen.getByRole('button', { name: 'Hide labels' }));
    expect(props.onToggleLabels).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Hide labels' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );

    rerender(<Toolbar {...props} showLabels={false} />);
    expect(screen.getByRole('button', { name: 'Show labels' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
  });

  it('fits the view', () => {
    const { props } = setup();

    fireEvent.click(screen.getByRole('button', { name: 'Fit to view' }));
    expect(props.onFit).toHaveBeenCalledTimes(1);
  });

  it('jumps to the active build when there is one', () => {
    const { props } = setup({ canJump: true });
    const jump = screen.getByRole('button', { name: 'Jump to active' });

    expect(jump).toBeEnabled();
    expect(jump).not.toHaveAttribute('title');
    fireEvent.click(jump);
    expect(props.onJump).toHaveBeenCalledTimes(1);
  });

  it('disables jump with an explanation when nothing is active', () => {
    const { props } = setup({ canJump: false });
    const jump = screen.getByRole('button', { name: 'Jump to active' });

    expect(jump).toBeDisabled();
    expect(jump).toHaveAttribute('title', 'No running or blocked builds');
    fireEvent.click(jump);
    expect(props.onJump).not.toHaveBeenCalled();
  });
});

describe('Toolbar progress chips', () => {
  it('always shows done and only the other states that have jobs, in a fixed order', () => {
    setup({
      progress: progress({
        done: 0,
        failed: 2,
        running: 0,
        queued: 1,
        pending: 3,
        wontRun: 4
      })
    });
    const group = screen.getByRole('group', { name: 'Event progress' });

    expect(
      within(group)
        .getAllByRole('button')
        .map(b => b.textContent)
    ).toEqual(['0 done', '2 failed', '1 queued', '3 pending', "4 won't run"]);
  });

  it('filters by a chip and clears the filter when the active chip is clicked again', () => {
    const { props, rerender } = setup({
      progress: progress({ done: 1, running: 2 })
    });

    fireEvent.click(screen.getByRole('button', { name: '2 running' }));
    expect(props.onStateFilter).toHaveBeenLastCalledWith('running');
    expect(screen.getByRole('button', { name: '2 running' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    rerender(<Toolbar {...props} stateFilter="running" />);
    expect(screen.getByRole('button', { name: '2 running' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.getByRole('button', { name: '1 done' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );

    fireEvent.click(screen.getByRole('button', { name: '2 running' }));
    expect(props.onStateFilter).toHaveBeenLastCalledWith(null);

    fireEvent.click(screen.getByRole('button', { name: '1 done' }));
    expect(props.onStateFilter).toHaveBeenLastCalledWith('done');
  });
});

describe('Toolbar pin and lens', () => {
  it('names the pinned node and unpins it', () => {
    const { props, rerender } = setup({ pinned: 'deploy' });

    expect(screen.getByText(/Following deploy/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Unpin' }));
    expect(props.onUnpin).toHaveBeenCalledTimes(1);

    rerender(<Toolbar {...props} pinned={null} />);
    expect(screen.queryByRole('button', { name: 'Unpin' })).toBeNull();
  });

  it('summarises the hovered route and what is still in play downstream', () => {
    setup({
      lens: lens(['main', 'build'], ['other'], true),
      lensSummary: summary({
        running: ['a'],
        queued: ['b', 'c'],
        waitingOnJoin: [
          { name: 'deploy', satisfied: ['t1'], pending: ['t2', 't3'], total: 3 }
        ],
        wontRun: ['x']
      })
    });
    const status = screen.getByText('Route taken: 2 jobs')
      .parentElement as HTMLElement;

    expect([...status.children].map(c => c.textContent)).toEqual([
      'Route taken: 2 jobs',
      'Possible but not run: 1',
      'Route inferred from neighbouring builds',
      'Running: 1',
      'Queued: 2',
      'deploy: 1 of 3 inputs done',
      'Will not run: 1'
    ]);
  });

  it('leaves out empty lens parts and keeps the lens area empty without a lens', () => {
    const { props, rerender } = setup({
      lens: lens(['main']),
      lensSummary: summary()
    });
    const status = screen.getByText('Route taken: 1 job')
      .parentElement as HTMLElement;

    expect(status.children).toHaveLength(1);

    rerender(
      <Toolbar
        {...props}
        lens={null}
        lensSummary={summary({ running: ['a'] })}
      />
    );
    expect(status).toBeEmptyDOMElement();
    expect(status).toHaveAttribute('role', 'status');
  });
});

describe('Toolbar without an event', () => {
  it('only offers search, labels and fit', () => {
    setup({
      event: false,
      progress: progress({ done: 3 }),
      lens: lens(['main']),
      lensSummary: summary()
    });

    expect(screen.getAllByRole('button').map(b => b.textContent)).toEqual([
      'Hide labels',
      'Fit to view'
    ]);
    expect(screen.queryByRole('group', { name: 'Event progress' })).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('Toolbar in Japanese', () => {
  it('translates the controls and counts', () => {
    setup(
      {
        matchCount: 0,
        canJump: false,
        progress: progress({ done: 2 }),
        pinned: 'deploy'
      },
      'ja'
    );

    expect(
      screen.getByRole('searchbox', { name: 'ジョブを検索' })
    ).toBeInTheDocument();
    expect(screen.getByText('一致なし')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'ラベルを隠す' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '全体を表示' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '実行中へ移動' })
    ).toHaveAttribute('title', '実行中またはブロック中のビルドはありません');
    expect(
      screen.getByRole('group', { name: 'イベントの進行状況' })
    ).toHaveTextContent('完了 2');
    expect(
      screen.getByRole('button', { name: '固定を解除' })
    ).toBeInTheDocument();
  });
});
