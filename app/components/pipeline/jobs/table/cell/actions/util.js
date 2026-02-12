import { stoppableStatuses } from 'screwdriver-ui/utils/build';

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
 * @param isPipelineInactive {boolean} Boolean indicating if the pipeline is inactive
 * @param canStartFromView {boolean} Boolean indicating if the job can be started from the current view
 * @param job {object} Job object in the shape returned by the API
 * @returns {boolean}
 */
export const isStartButtonDisabled = (
  isPipelineInactive,
  canStartFromView,
  job
) => {
  if (isPipelineInactive || !canStartFromView) {
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
  return build ? !stoppableStatuses.includes(build.status) : true;
};
