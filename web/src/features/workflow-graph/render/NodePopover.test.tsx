import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '~/test/render';
import type { FlowNodeData } from './flow';
import { DESCRIPTION_MAX, NodePopover } from './NodePopover';
import type { WorkflowNodeInfo } from './types';

const info = (over: Partial<WorkflowNodeInfo> = {}): WorkflowNodeInfo => ({
  name: 'main',
  jobId: 11,
  buildId: 22,
  status: 'SUCCESS',
  canStart: true,
  canStop: false,
  canToggle: true,
  ...over
});

const jobData = (over: Partial<WorkflowNodeInfo> = {}): FlowNodeData => ({
  kind: 'job',
  name: 'main',
  label: 'main',
  status: over.status ?? 'SUCCESS',
  tier: null,
  dim: false,
  matched: false,
  showLabels: true,
  active: false,
  pinned: false,
  info: info(over)
});

const stageData = (
  over: Partial<NonNullable<FlowNodeData['stage']>> = {}
): FlowNodeData => ({
  kind: 'stage',
  name: 'integration',
  label: 'integration',
  status: 'SUCCESS',
  tier: null,
  dim: false,
  matched: false,
  showLabels: true,
  active: false,
  pinned: false,
  stage: {
    name: 'integration',
    id: 7,
    collapsed: false,
    canStart: true,
    ...over
  }
});

function show(data: FlowNodeData, triggers?: string[]) {
  const onAction = vi.fn();
  const onClose = vi.fn();

  renderWithProviders(
    <NodePopover
      data={data}
      triggers={triggers}
      sha="abcdef1234567890"
      position={{ left: 0, top: 0 }}
      onAction={onAction}
      onClose={onClose}
    />
  );

  return { onAction, onClose, dialog: within(screen.getByRole('dialog')) };
}

describe('<NodePopover /> job', () => {
  it('offers Restart (Inherit) and New Run (Fresh) at the event sha, each with its hint', () => {
    const { dialog, onAction } = show(jobData());

    expect(dialog.getByText('Run job at #abcdef1')).toBeInTheDocument();
    expect(
      dialog.getByRole('button', { name: 'Restart (Inherit)' })
    ).toHaveAccessibleDescription(
      "Use this event's metadata and build statuses."
    );
    expect(
      dialog.getByRole('button', { name: 'New Run (Fresh)' })
    ).toHaveAccessibleDescription(
      'Clean start from this job. No metadata or build statuses.'
    );
    fireEvent.click(dialog.getByRole('button', { name: 'New Run (Fresh)' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'start',
      node: expect.objectContaining({ name: 'main' })
    });
  });

  it('links build details and build metrics', () => {
    const { dialog, onAction } = show(jobData());

    fireEvent.click(
      dialog.getByRole('button', { name: 'Go to build metrics' })
    );
    expect(onAction).toHaveBeenCalledWith({
      type: 'view-metrics',
      node: expect.objectContaining({ jobId: 11 })
    });
    expect(
      dialog.getByRole('button', { name: 'Go to build details' })
    ).toBeEnabled();
  });

  it('disables build details when there is no build', () => {
    const { dialog } = show(jobData({ buildId: undefined, status: undefined }));

    expect(
      dialog.getByRole('button', { name: 'Go to build details' })
    ).toBeDisabled();
  });

  it('asks to toggle an enabled job from its Disable button', () => {
    const { dialog, onAction } = show(jobData());

    fireEvent.click(dialog.getByRole('button', { name: 'Disable this job' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'toggle-job',
      node: expect.objectContaining({ jobId: 11 })
    });
  });

  it('shows who disabled the job and why, and offers Enable', () => {
    const { dialog } = show(
      jobData({
        isDisabled: true,
        stateChanger: 'batman',
        stateChangeMessage: 'flaky',
        canStart: false
      })
    );

    expect(dialog.getByText('Disabled by batman')).toHaveAttribute(
      'title',
      'flaky'
    );
    expect(dialog.getByText('Reason: flaky')).toBeInTheDocument();
    expect(
      dialog.getByRole('button', { name: 'Enable this job' })
    ).toBeInTheDocument();
    expect(dialog.queryByText(/Run job at/)).toBeNull();
  });

  it('hides enable/disable when it cannot be toggled (read-only)', () => {
    const { dialog } = show(jobData({ canToggle: false, canStart: false }));

    expect(dialog.queryByRole('button', { name: /this job/ })).toBeNull();
  });

  it('explains a manual start disabled by annotation', () => {
    const { dialog } = show(
      jobData({ manualStartDisabled: true, canStart: false })
    );

    expect(
      dialog.getByText('Manual start is disabled by annotation')
    ).toBeInTheDocument();
  });

  it('offers Stop frozen build for a FROZEN build', () => {
    const { dialog, onAction } = show(
      jobData({ status: 'FROZEN', canStop: true })
    );

    fireEvent.click(dialog.getByRole('button', { name: 'Stop frozen build' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'stop',
      node: expect.objectContaining({ buildId: 22, status: 'FROZEN' })
    });
  });

  it('collapses a long description', () => {
    const text = 'x'.repeat(DESCRIPTION_MAX + 10);
    const { dialog } = show(jobData({ description: text }));
    const toggle = dialog.getByRole('button', { expanded: false });

    expect(toggle).toHaveTextContent(`${'x'.repeat(DESCRIPTION_MAX)}...`);
    fireEvent.click(toggle);
    expect(dialog.getByRole('button', { expanded: true })).toHaveTextContent(
      text
    );
  });

  it('shows a short description as is', () => {
    const { dialog } = show(jobData({ description: 'short' }));

    expect(dialog.getByText('short')).toBeInTheDocument();
    expect(dialog.queryByRole('button', { expanded: false })).toBeNull();
  });
});

describe('<NodePopover /> stage', () => {
  it('starts the stage with the chosen mode', () => {
    const { dialog, onAction } = show(stageData());

    expect(dialog.getByText('Run stage at #abcdef1')).toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Restart (Inherit)' }));
    expect(onAction).toHaveBeenCalledWith({
      type: 'start-stage',
      action: 'restart',
      stage: expect.objectContaining({ name: 'integration' })
    });
  });

  it('says when the stage cannot run from here', () => {
    const { dialog } = show(stageData({ canStart: false }));

    expect(dialog.getByText('Can not run at this stage')).toBeInTheDocument();
  });

  it('says when manual start is disabled by annotation', () => {
    const { dialog } = show(
      stageData({ canStart: false, manualStartDisabled: true })
    );

    expect(
      dialog.getByText('Manual start is disabled by annotation')
    ).toBeInTheDocument();
  });

  it('shows nothing to run when read-only', () => {
    const { dialog } = show(stageData({ canStart: false, readOnly: true }));

    expect(dialog.queryByText('Can not run at this stage')).toBeNull();
    expect(dialog.queryByRole('button', { name: /Restart/ })).toBeNull();
  });
});

describe('<NodePopover /> pipelines', () => {
  it('links each downstream pipeline by its ~sd@id:job name', () => {
    const { dialog, onAction } = show(
      {
        ...jobData(),
        kind: 'downstream',
        name: '~sd-main-triggers',
        info: undefined
      },
      ['~sd@9:a']
    );

    fireEvent.click(
      dialog.getByRole('button', { name: 'Go to downstream pipeline ~sd@9:a' })
    );
    expect(onAction).toHaveBeenCalledWith({
      type: 'open-external',
      pipelineId: '9',
      jobName: 'a'
    });
  });
});
