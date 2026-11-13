import { useT } from '~/i18n/useT';
import type { FlowState, Lens, Progress, DownstreamInPlay } from '../lens';

export interface ToolbarProps {
  query: string;
  onQuery: (q: string) => void;
  matchCount: number | null;
  showLabels: boolean;
  onToggleLabels: () => void;
  onFit: () => void;
  onJump: () => void;
  canJump: boolean;
  progress: Progress;
  stateFilter: FlowState | null;
  onStateFilter: (s: FlowState | null) => void;
  pinned: string | null;
  onUnpin: () => void;
  lens: Lens | null;
  lensSummary: DownstreamInPlay | null;
  /** false: a pipeline without an event (validator, visualizer): no progress, jump or lens. */
  event: boolean;
}

const CHIPS: Array<{ state: FlowState; count: (p: Progress) => number }> = [
  { state: 'done', count: p => p.done },
  { state: 'failed', count: p => p.failed },
  { state: 'running', count: p => p.running },
  { state: 'queued', count: p => p.queued },
  { state: 'pending', count: p => p.pending },
  { state: 'wont-run', count: p => p.wontRun }
];

export function Toolbar(p: ToolbarProps) {
  const t = useT();
  // Static ids so the extractor/usage test can see them.
  const chipText = (state: FlowState, count: number) => {
    switch (state) {
      case 'done':
        return t('workflowGraph.progress.done', { count });
      case 'failed':
        return t('workflowGraph.progress.failed', { count });
      case 'running':
        return t('workflowGraph.progress.running', { count });
      case 'queued':
        return t('workflowGraph.progress.queued', { count });
      case 'pending':
        return t('workflowGraph.progress.pending', { count });
      default:
        return t('workflowGraph.progress.wontRun', { count });
    }
  };

  return (
    <div className="wg-toolbar">
      <input
        type="search"
        className="wg-search"
        value={p.query}
        placeholder={t('workflowGraph.search.placeholder')}
        aria-label={t('workflowGraph.search.label')}
        onChange={e => p.onQuery(e.target.value)}
      />
      {p.matchCount !== null && (
        <span className="wg-muted" role="status">
          {t('workflowGraph.search.matches', { count: p.matchCount })}
        </span>
      )}
      <button
        type="button"
        className="wg-btn"
        aria-pressed={p.showLabels}
        onClick={p.onToggleLabels}
      >
        {t(
          p.showLabels
            ? 'workflowGraph.labels.hide'
            : 'workflowGraph.labels.show'
        )}
      </button>
      <button type="button" className="wg-btn" onClick={p.onFit}>
        {t('workflowGraph.fit')}
      </button>
      {p.event && (
        <button
          type="button"
          className="wg-btn"
          disabled={!p.canJump}
          title={p.canJump ? undefined : t('workflowGraph.jumpActive.none')}
          onClick={p.onJump}
        >
          {t('workflowGraph.jumpActive')}
        </button>
      )}

      {p.event && (
        <div
          className="wg-progress"
          role="group"
          aria-label={t('workflowGraph.progress.label')}
        >
          {CHIPS.map(c => {
            const count = c.count(p.progress);

            return count > 0 || c.state === 'done' ? (
              <button
                key={c.state}
                type="button"
                className={`wg-chip wg-chip--${c.state}`}
                aria-pressed={p.stateFilter === c.state}
                onClick={() =>
                  p.onStateFilter(p.stateFilter === c.state ? null : c.state)
                }
              >
                {chipText(c.state, count)}
              </button>
            ) : null;
          })}
        </div>
      )}

      {p.pinned && (
        <span className="wg-pin">
          {t('workflowGraph.lens.pinned', { name: p.pinned })}{' '}
          <button type="button" className="wg-btn" onClick={p.onUnpin}>
            {t('workflowGraph.lens.unpin')}
          </button>
        </span>
      )}

      {/* Always rendered with a fixed height so hovering a node never moves the graph. */}
      {p.event && (
        <div className="wg-lens" role="status">
          {p.lens && p.lensSummary ? (
            <>
              <span>
                {t('workflowGraph.lens.upstream', {
                  count: p.lens.upstream.taken.size
                })}
              </span>
              {p.lens.upstream.possible.size > 0 && (
                <span>
                  {t('workflowGraph.lens.notTaken', {
                    count: p.lens.upstream.possible.size
                  })}
                </span>
              )}
              {p.lens.upstream.inferred && (
                <span className="wg-muted">
                  {t('workflowGraph.lens.inferred')}
                </span>
              )}
              {p.lensSummary.running.length > 0 && (
                <span>
                  {t('workflowGraph.lens.running', {
                    count: p.lensSummary.running.length
                  })}
                </span>
              )}
              {p.lensSummary.queued.length > 0 && (
                <span>
                  {t('workflowGraph.lens.queued', {
                    count: p.lensSummary.queued.length
                  })}
                </span>
              )}
              {p.lensSummary.waitingOnJoin.map(w => (
                <span key={w.name}>
                  {t('workflowGraph.lens.joinInputs', {
                    name: w.name,
                    satisfied: w.satisfied.length,
                    total: w.total
                  })}
                </span>
              ))}
              {p.lensSummary.wontRun.length > 0 && (
                <span>
                  {t('workflowGraph.lens.wontRun', {
                    count: p.lensSummary.wontRun.length
                  })}
                </span>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
