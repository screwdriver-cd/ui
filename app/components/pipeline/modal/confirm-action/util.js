/**
 * Truncate commit message to 150 characters
 * @param commitMessage
 * @returns {string|*}
 */
export function truncateMessage(commitMessage) {
  const cutOff = 150;

  return commitMessage.length > cutOff
    ? `${commitMessage.substring(0, cutOff)}...`
    : commitMessage;
}

/**
 * Capitalize first letter of string
 * @param string
 * @returns {string}
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Determine if the action has parameters
 * @param pipeline
 * @param event
 * @returns {boolean}
 */
export function isParameterized(pipeline, defaultJobParameters, event) {
  const pipelineParameters = pipeline.parameters || {};
  const jobParameters = defaultJobParameters || {};
  const eventParameters = event?.meta?.parameters || {};

  return (
    Object.keys(pipelineParameters).length > 0 ||
    Object.keys(jobParameters).length > 0 ||
    Object.keys(eventParameters).length > 0
  );
}

/**
 * Detect whether an event originated from a pr-closed webhook or its restart lineage.
 * @param {object} event Event object in the shape returned by the API
 * @returns {boolean}
 */
function isPrClosedEventLineage(event) {
  return Boolean(
    event && (event.startFrom?.startsWith('~pr-closed') || event.meta?.sd?.pr)
  );
}

/**
 * Build core post body for triggering an event
 * @param jobName {string} Name of the job to start from
 * @param startAction {string} Name of start type (start or restart)
 * @param event {object} Event object in the shape returned by the API
 * @param sha {string} Commit SHA
 * @param prNum {number} Pull request number
 * @param parameters {object} Parameters to pass to the event
 * @returns {object}
 */
// eslint-disable-next-line max-params
export const buildPostBody = (
  jobName,
  startAction,
  event,
  sha,
  prNum,
  parameters
) => {
  const usePrEventPayload = Boolean(prNum) && !isPrClosedEventLineage(event);
  const data = {
    startFrom: jobName,
    startAction
  };

  if (usePrEventPayload) {
    data.prNum = prNum;
    data.parentEventId = event.id;
    data.groupEventId = event.groupEventId;

    if (jobName !== '~pr' && !jobName.startsWith(`PR-${prNum}:`)) {
      data.startFrom = `PR-${prNum}:${jobName}`;
    }
  } else if (event) {
    data.parentEventId = event.id;
    data.groupEventId = event.groupEventId;
  } else if (sha) {
    data.sha = sha;
  }

  if (parameters) {
    data.meta = { parameters };
  }

  return data;
};
