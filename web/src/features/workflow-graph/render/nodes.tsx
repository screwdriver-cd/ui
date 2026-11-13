import { Icon } from '~/components/Icon';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  memo,
  type ComponentType,
  type KeyboardEvent,
  type MouseEvent
} from 'react';
import { useT } from '~/i18n/useT';
import { useGraphContext } from './context';
import type { FlowNode } from './flow';
import { ICON_FONT_GLYPHS, StatusIcon, statusClass } from './status';

function Handles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className="wg-handle"
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className="wg-handle"
      />
    </>
  );
}

function classes(base: string, d: FlowNode['data'], extra = '') {
  return [
    'wg-node',
    base,
    statusClass(d.status),
    d.tier ? `wg-tier--${d.tier}` : '',
    d.dim ? 'wg-dim' : '',
    d.matched ? 'wg-match' : '',
    d.pinned ? 'wg-pinned' : '',
    d.active ? 'wg-active' : '',
    extra
  ]
    .filter(Boolean)
    .join(' ');
}

function JoinBadge({ join }: { join: NonNullable<FlowNode['data']['join']> }) {
  const t = useT();
  const and = join.kind === 'AND';

  return (
    <span
      className={`wg-join wg-join--${and ? 'and' : 'or'}`}
      title={t(and ? 'workflowGraph.join.and' : 'workflowGraph.join.or')}
      data-testid={`join-${join.kind.toLowerCase()}`}
    >
      {and
        ? t('workflowGraph.join.andBadge', {
            satisfied: join.satisfied,
            total: join.total
          })
        : t('workflowGraph.join.orBadge')}
    </span>
  );
}

/** Shared interactive wrapper behaviour: hover lens, click/Enter popover. */
function useNodeHandlers(name: string) {
  const { onHover, onActivate, interactive } = useGraphContext();

  if (!interactive) return {};

  return {
    onMouseEnter: () => onHover(name),
    onMouseLeave: () => onHover(null),
    onFocus: () => onHover(name),
    onBlur: () => onHover(null),
    onClick: (e: MouseEvent<HTMLElement>) => onActivate(name, e.currentTarget),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(name, e.currentTarget);
      }
    }
  };
}

/** Mini variant: a plain status-coloured block. Not focusable, no icon, label or handlers. */
function MiniBlock({ base, data }: { base: string; data: FlowNode['data'] }) {
  return (
    <div
      className={classes(`${base} wg-mini`, data)}
      data-node={data.name}
      aria-hidden="true"
    >
      <Handles />
    </div>
  );
}

const JobNodeFull = memo(function JobNode({ data }: NodeProps<FlowNode>) {
  const handlers = useNodeHandlers(data.name);

  return (
    <div
      className={classes('wg-job', data)}
      role="button"
      tabIndex={0}
      data-node={data.name}
      aria-label={data.label}
      title={data.label}
      {...handlers}
    >
      <Handles />
      <StatusIcon status={data.status} />
      {data.showLabels && <span className="wg-label">{data.label}</span>}
      {data.join && <JoinBadge join={data.join} />}
    </div>
  );
});

const TriggerNodeFull = memo(function TriggerNode({
  data
}: NodeProps<FlowNode>) {
  const handlers = useNodeHandlers(data.name);

  return (
    <div
      className={classes(
        'wg-trigger',
        data,
        data.showLabels ? '' : 'wg-unlabelled'
      )}
      role="button"
      tabIndex={0}
      data-node={data.name}
      aria-label={data.label}
      title={data.label}
      {...handlers}
    >
      <Handles />
      {data.status === 'STARTED_FROM' && <StatusIcon status="STARTED_FROM" />}
      {data.showLabels && <span className="wg-label">{data.label}</span>}
    </div>
  );
});

const ExternalPipelineNodeFull = memo(function ExternalPipelineNode({
  data
}: NodeProps<FlowNode>) {
  const t = useT();
  const handlers = useNodeHandlers(data.name);

  return (
    <div
      className={classes('wg-external', data)}
      role="button"
      tabIndex={0}
      data-node={data.name}
      aria-label={data.label}
      title={t('workflowGraph.external', { id: data.externalId ?? '' })}
      {...handlers}
    >
      <Handles />
      <span className="wg-icon" aria-hidden="true">
        {ICON_FONT_GLYPHS.DOWNSTREAM_TRIGGER}
      </span>
      {data.showLabels && <span className="wg-label">{data.label}</span>}
      {data.join && <JoinBadge join={data.join} />}
    </div>
  );
});

const DownstreamTriggersNodeFull = memo(function DownstreamTriggersNode({
  data
}: NodeProps<FlowNode>) {
  const t = useT();
  const handlers = useNodeHandlers(data.name);

  return (
    <div
      className={classes('wg-downstream', data)}
      role="button"
      tabIndex={0}
      data-node={data.name}
      {...handlers}
    >
      <Handles />
      <span className="wg-icon" aria-hidden="true">
        {ICON_FONT_GLYPHS.DOWNSTREAM_TRIGGER}
      </span>
      <span className="wg-label">
        {t('workflowGraph.downstream', { count: data.downstreamCount ?? 0 })}
      </span>
    </div>
  );
});

/** A collapsed stage: a single node standing in for its jobs. */
const JobGroupNodeFull = memo(function JobGroupNode({
  data
}: NodeProps<FlowNode>) {
  const t = useT();
  const { onToggleStage, interactive } = useGraphContext();
  const handlers = useNodeHandlers(data.name);
  const stageName = data.stage?.name ?? '';

  return (
    <div
      className={classes('wg-group', data)}
      role="button"
      tabIndex={0}
      data-node={data.name}
      aria-label={data.label}
      title={data.label}
      {...handlers}
    >
      <Handles />
      <StatusIcon status={data.status ?? 'COLLAPSED'} />
      {data.showLabels && <span className="wg-label">{data.label}</span>}
      {interactive && (
        <button
          type="button"
          className="wg-toggle"
          aria-label={t('workflowGraph.stage.expand', { name: stageName })}
          onClick={e => {
            e.stopPropagation();
            onToggleStage(stageName);
          }}
        >
          +
        </button>
      )}
    </div>
  );
});

/** Picks the thumbnail block for the mini variant (no interaction context), the full node otherwise. */
function miniAware(base: string, Full: ComponentType<NodeProps<FlowNode>>) {
  return memo(function MiniAware(props: NodeProps<FlowNode>) {
    const { interactive } = useGraphContext();

    return interactive ? (
      <Full {...props} />
    ) : (
      <MiniBlock base={base} data={props.data} />
    );
  });
}

export const JobNode = miniAware('wg-job', JobNodeFull);
export const TriggerNode = miniAware('wg-trigger', TriggerNodeFull);
export const ExternalPipelineNode = miniAware(
  'wg-external',
  ExternalPipelineNodeFull
);
export const DownstreamTriggersNode = miniAware(
  'wg-downstream',
  DownstreamTriggersNodeFull
);
export const JobGroupNode = miniAware('wg-group', JobGroupNodeFull);

/** Expanded stage: a compound box with a header. Children are positioned by React Flow. */
export const StageGroupNode = memo(function StageGroupNode({
  id,
  data
}: NodeProps<FlowNode>) {
  const t = useT();
  const { onToggleStage, onActivate, interactive } = useGraphContext();
  const stage = data.stage;

  if (!interactive) {
    return (
      <div
        className={classes('wg-stage wg-mini', data)}
        data-stage={data.name}
        aria-hidden="true"
      >
        <Handles />
      </div>
    );
  }

  return (
    <div className={classes('wg-stage', data)} data-stage={data.name}>
      <Handles />
      <div className="wg-stage-header">
        <StatusIcon status={data.status ?? 'UNKNOWN'} />
        <span className="wg-stage-name" title={data.name}>
          {data.name}
        </span>
        {/* Ember's stage menu: opens the stage popover (Restart / New Run, or why it cannot run). */}
        {interactive && stage && !stage.readOnly && (
          <button
            type="button"
            className="wg-toggle"
            title={t('workflowGraph.action.startStage')}
            aria-label={t('workflowGraph.action.startStage')}
            aria-haspopup="dialog"
            onClick={e => onActivate(id, e.currentTarget)}
          >
            <Icon name="circlePlay" />
          </button>
        )}
        {interactive && (
          <button
            type="button"
            className="wg-toggle"
            aria-label={t('workflowGraph.stage.collapse', { name: data.name })}
            onClick={() => onToggleStage(data.name)}
          >
            <Icon name="minus" />
          </button>
        )}
      </div>
    </div>
  );
});

export const nodeTypes = {
  job: JobNode,
  trigger: TriggerNode,
  external: ExternalPipelineNode,
  downstream: DownstreamTriggersNode,
  jobGroup: JobGroupNode,
  stage: StageGroupNode
};
