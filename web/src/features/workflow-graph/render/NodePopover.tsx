import { Icon } from '~/components/Icon';
import { useEffect, useId, useState } from 'react';
import { useT } from '~/i18n/useT';
import type { FlowNodeData } from './flow';
import { StatusIcon, useStatusLabel } from './status';
import type { JobAction, RunMode, WorkflowNodeInfo } from './types';

export interface PopoverProps {
  data: FlowNodeData;
  triggers?: string[];
  /** Event commit SHA, shown as "Run job at #sha". */
  sha?: string;
  position: { left: number; top: number };
  onAction: (action: JobAction) => void;
  onClose: () => void;
}

/** Ember's tooltip collapses descriptions longer than this. */
export const DESCRIPTION_MAX = 25;

const EXTERNAL = /^~?sd@(\d+):(.+)$/;

/** `#` + the first 7 characters, as Ember's `getTruncatedSha`. */
const shortSha = (sha?: string) => (sha ? `#${sha.substring(0, 7)}` : '');

/** Restart (Inherit) / New Run (Fresh), each with Ember's explanation underneath. */
function RunChoices({
  label,
  freshHint,
  onRun
}: {
  label: string;
  freshHint: string;
  onRun: (mode: RunMode) => void;
}) {
  const t = useT();
  const id = useId();

  return (
    <div className="wg-popover-run">
      <div className="wg-popover-note wg-popover-run-label">{label}</div>
      <div className="wg-popover-actions wg-popover-actions--list">
        <button
          type="button"
          className="wg-btn"
          aria-describedby={`${id}-restart`}
          onClick={() => onRun('restart')}
        >
          <Icon name="rotateRight" /> {t('workflowGraph.action.restart')}
        </button>
        <small id={`${id}-restart`} className="wg-popover-note">
          {t('workflowGraph.action.restartHint')}
        </small>
        <button
          type="button"
          className="wg-btn"
          aria-describedby={`${id}-start`}
          onClick={() => onRun('start')}
        >
          <Icon name="circlePlay" /> {t('workflowGraph.action.start')}
        </button>
        <small id={`${id}-start`} className="wg-popover-note">
          {freshHint}
        </small>
      </div>
    </div>
  );
}

/** Long descriptions start collapsed; the caret expands them (Ember parity). */
function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  if (text.length <= DESCRIPTION_MAX) {
    return <div className="wg-popover-note wg-popover-description">{text}</div>;
  }

  return (
    <button
      type="button"
      className="wg-popover-note wg-popover-description wg-popover-more"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
    >
      <Icon name={open ? 'caretDown' : 'caretRight'} />{' '}
      {open ? text : `${text.substring(0, DESCRIPTION_MAX)}...`}
    </button>
  );
}

function JobSection({
  info,
  sha,
  act
}: {
  info: WorkflowNodeInfo;
  sha?: string;
  act: (a: JobAction) => void;
}) {
  const t = useT();
  const statusLabel = useStatusLabel();
  const buildDetails = info.buildId !== undefined && info.status !== 'CREATED';

  return (
    <>
      <div className="wg-popover-status">
        {statusLabel(info.isDisabled ? 'DISABLED' : info.status)}
      </div>
      {info.isDisabled && (
        <div className="wg-popover-note" title={info.stateChangeMessage}>
          {info.stateChanger
            ? t('workflowGraph.node.disabledBy', { user: info.stateChanger })
            : t('workflowGraph.node.disabled')}
        </div>
      )}
      {info.isDisabled && info.stateChangeMessage && (
        <div className="wg-popover-note wg-popover-reason">
          {t('workflowGraph.node.reason', {
            message: info.stateChangeMessage
          })}
        </div>
      )}
      {!info.isDisabled && info.manualStartDisabled && (
        <div className="wg-popover-note">
          {t('workflowGraph.node.manualOff')}
        </div>
      )}
      {info.status === 'CREATED' && (
        <div className="wg-popover-note">
          {t('workflowGraph.node.waitingJoin')}
        </div>
      )}
      <div className="wg-popover-actions">
        <button
          type="button"
          className="wg-btn"
          disabled={!buildDetails}
          onClick={() => act({ type: 'view-build', node: info })}
        >
          {t('workflowGraph.action.viewBuild')}
        </button>
        {info.jobId !== undefined && (
          <button
            type="button"
            className="wg-btn"
            onClick={() => act({ type: 'view-metrics', node: info })}
          >
            <Icon name="chartLine" /> {t('workflowGraph.action.viewMetrics')}
          </button>
        )}
      </div>
      {/* Ember offers both whether or not the job has a build in this event. canStart already
          excludes disabled and manual-start-disabled jobs, which get the notes above instead. */}
      {info.canStart && (
        <RunChoices
          label={t('workflowGraph.node.runAt', { sha: shortSha(sha) })}
          freshHint={t('workflowGraph.action.startHint')}
          onRun={mode => act({ type: mode, node: info })}
        />
      )}
      {(info.canToggle || info.canStop) && (
        <div className="wg-popover-actions">
          {info.canToggle && (
            <button
              type="button"
              className="wg-btn"
              onClick={() => act({ type: 'toggle-job', node: info })}
            >
              {t(
                info.isDisabled
                  ? 'workflowGraph.action.enableJob'
                  : 'workflowGraph.action.disableJob'
              )}
            </button>
          )}
          {info.canStop && (
            <button
              type="button"
              className="wg-btn wg-btn--danger"
              onClick={() => act({ type: 'stop', node: info })}
            >
              {t(
                info.status === 'FROZEN'
                  ? 'workflowGraph.action.stopFrozen'
                  : 'workflowGraph.action.stop'
              )}
            </button>
          )}
        </div>
      )}
      {info.description && <Description text={info.description} />}
    </>
  );
}

function StageSection({
  stage,
  sha,
  act
}: {
  stage: NonNullable<FlowNodeData['stage']>;
  sha?: string;
  act: (a: JobAction) => void;
}) {
  const t = useT();

  if (stage.manualStartDisabled) {
    return (
      <div className="wg-popover-note">{t('workflowGraph.node.manualOff')}</div>
    );
  }
  if (stage.canStart) {
    return (
      <RunChoices
        label={t('workflowGraph.stage.runAt', { sha: shortSha(sha) })}
        freshHint={t('workflowGraph.action.startStageHint')}
        onRun={mode => act({ type: 'start-stage', stage, action: mode })}
      />
    );
  }
  if (stage.readOnly) return null;

  return (
    <div className="wg-popover-note">{t('workflowGraph.stage.cannotRun')}</div>
  );
}

/** Click popover with the actions the Ember tooltip offers. */
export function NodePopover({
  data,
  triggers,
  sha,
  position,
  onAction,
  onClose
}: PopoverProps) {
  const t = useT();
  const info = data.info;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKey);

    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const act = (a: JobAction) => {
    onAction(a);
    onClose();
  };
  const ext = data.name.match(EXTERNAL);

  return (
    <div
      className="wg-popover"
      role="dialog"
      aria-label={data.label}
      style={position}
    >
      <div className="wg-popover-title">
        <StatusIcon status={data.status} />
        <strong title={data.label}>{data.label}</strong>
        <button
          type="button"
          className="wg-toggle"
          aria-label={t('workflowGraph.action.close')}
          onClick={onClose}
        >
          <Icon name="xmark" />
        </button>
      </div>

      {data.kind === 'job' && info && (
        <JobSection info={info} sha={sha} act={act} />
      )}

      {(data.kind === 'stage-group' || data.kind === 'stage') && data.stage && (
        <StageSection stage={data.stage} sha={sha} act={act} />
      )}

      {data.kind === 'external' && ext && (
        <div className="wg-popover-actions">
          <button
            type="button"
            className="wg-btn"
            onClick={() =>
              act({
                type: 'open-external',
                pipelineId: ext[1] as string,
                jobName: ext[2]
              })
            }
          >
            {t('workflowGraph.action.goRemote')}
          </button>
        </div>
      )}

      {data.kind === 'downstream' && (
        <div className="wg-popover-actions wg-popover-actions--list">
          {(triggers ?? []).map(trig => {
            const m = trig.match(EXTERNAL);

            return m ? (
              <button
                key={trig}
                type="button"
                className="wg-btn"
                title={trig}
                onClick={() =>
                  act({
                    type: 'open-external',
                    pipelineId: m[1] as string,
                    jobName: m[2]
                  })
                }
              >
                {t('workflowGraph.action.goDownstream', { name: trig })}
              </button>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}
