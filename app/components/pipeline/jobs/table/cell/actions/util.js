import { unfinishedStatuses } from 'screwdriver-ui/utils/build';

/**
 * Checks if the job can be triggered
 * @param job {object} Job object in the shape returned by the API
 * @returns {boolean}
 */
export const canJobBeTriggered = job => {
  if (job.state === 'DISABLED') {
    return false;
  }

  return (
    job?.permutations?.[0]?.annotations?.[
      'screwdriver.cd/manualStartEnabled'
    ] !== false
  );
};

/**
 * Check if the start button should be disabled
 * @param isPipelineInactive {boolean}
 * @param job {object} Job object in the shape returned by the API
 * @returns {boolean}
 */
export const isStartButtonDisabled = (isPipelineInactive, job) => {
  if (isPipelineInactive) {
    return true;
  }

  return !canJobBeTriggered(job);
};

/**
 * Check if the stop button should be disabled
 * @param build {object} Build object in the shape returned by the API
 * @returns {boolean}
 */
export const isStopButtonDisabled = build => {
  return build ? !unfinishedStatuses.includes(build.status) : true;
};

/**
 * Check if the restart button should be disabled
 * @param isPipelineInactive {boolean}
 * @param job {object} Job object in the shape returned by the API
 * @param build {object} Build object in the shape returned by the API
 * @returns {boolean}
 */
export const isRestartButtonDisabled = (isPipelineInactive, job, build) => {
  if (isStartButtonDisabled(isPipelineInactive, job)) {
    return true;
  }

  return build ? unfinishedStatuses.includes(build.status) : true;
};

/**
 * Check if the notice should be displayed.
 * @param pipeline {object} Pipeline object in the shape returned by the API
 * @param job {object} Job object in the shape returned by the API
 * @returns {boolean}
 */
export const shouldDisplayNotice = (pipeline, job) => {
  const { edges } = pipeline.workflowGraph;
  const jobName = job.name;

  return !edges.some(edge => edge.dest === jobName && edge.src.startsWith('~'));
};
