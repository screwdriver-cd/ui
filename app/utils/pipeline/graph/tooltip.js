import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { EXTERNAL_TRIGGER_ALL } from 'screwdriver-data-schema/config/regex';

/**
 * Determines if a node can show a tooltip
 * @param node
 */
export const nodeCanShowTooltip = node => {
  const { name } = node;

  return (
    name !== '~commit' &&
    name !== '~pr' &&
    !name.startsWith('~commit:') &&
    !name.startsWith('~pr:')
  );
};

/**
 * Constructs tooltip data for a given node
 * @param node
 * @param event   Event data for the pipeline (API response from /pipelines/:id/events/:eventId)
 * @param jobs    Jobs for the pipeline (API response from /pipelines/:id/jobs)
 * @param builds  Builds for the pipeline (API response from /pipelines/:id/builds)
 */
export function getTooltipData(node, event, jobs, builds = []) {
  const isTrigger = node.name.startsWith('~');

  if (isTrigger) {
    const externalTriggerMatch = node.name.match(EXTERNAL_TRIGGER_ALL);
    const downstreamTriggerMatch = node.name.match(/^~sd-([\w-]+)-triggers$/);

    // Add external trigger data if relevant
    if (externalTriggerMatch) {
      const externalTrigger = {
        pipelineId: externalTriggerMatch[1],
        jobName: externalTriggerMatch[2]
      };

      return {
        externalTrigger
      };
    }

    // Add downstream trigger data if relevant
    if (downstreamTriggerMatch) {
      const triggers = [];

      node.triggers.forEach(t => {
        const downstreamTrigger = t.match(EXTERNAL_TRIGGER_ALL);

        triggers.push({
          triggerName: t,
          pipelineId: downstreamTrigger[1],
          jobName: downstreamTrigger[2]
        });
      });

      return {
        triggers
      };
    }
  }

  const tooltip = {
    displayStop: isActiveBuild(node.status),
    selectedEvent: event
  };

  const job = { ...node };

  if (event.prNum) {
    const originalJob = jobs.find(j => j.name === job.name);

    job.isDisabled = originalJob ? originalJob.state === 'DISABLED' : false;
  }

  const build = builds.find(b => b.jobId === node.id);

  if (build) {
    job.buildId = build.id;
    job.status = build.status;
  }

  tooltip.job = job;

  return tooltip;
}
