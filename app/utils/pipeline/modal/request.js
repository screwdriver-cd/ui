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
export function buildPostBody( // eslint-disable-line import/prefer-default-export
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

  if (job && job.status) {
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
