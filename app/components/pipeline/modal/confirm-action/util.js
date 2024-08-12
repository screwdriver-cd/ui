import { flattenParameters } from 'screwdriver-ui/utils/pipeline/parameters';

/**
 * Initialize parameters from an event API response object
 * @param event
 * @returns {undefined|*}
 */
export function initializeParameters(event) {
  if (event.meta?.parameters && event.meta.parameters.length > 0) {
    return flattenParameters(event.meta.parameters);
  }

  return undefined;
}

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
 * Build post body for starting a job
 * @param username
 * @param pipelineId
 * @param job
 * @param event
 * @param parameters
 * @param isFrozen
 * @param reason
 * @returns {{causeMessage: string, pipelineId}}
 */
export function buildPostBody(
  username,
  pipelineId,
  job,
  event,
  parameters,
  isFrozen,
  reason
) {
  const data = {
    pipelineId,
    causeMessage: `Manually started by ${username}`
  };

  if (job.status) {
    data.startFrom = job.name;
    data.groupEventId = event.groupEventId;
    data.parentEventId = event.id;
  } else {
    data.startFrom = '~commit';
  }

  if (parameters) {
    data.meta = { parameters };
  }

  if (isFrozen) {
    data.causeMessage = `[force start]${reason}`;
  }

  return data;
}
