/**
 * Build post body for starting a job
 * @param username
 * @param pipelineId
 * @param job
 * @param event
 * @param parameters
 * @param isFrozen
 * @param reason
 * @param prNum
 * @returns {{causeMessage: string, pipelineId}}
 */
export function buildPostBody( // eslint-disable-line import/prefer-default-export
  username,
  pipelineId,
  job,
  event,
  parameters,
  isFrozen,
  reason,
  prNum
) {
  const data = {
    pipelineId,
    causeMessage: `Manually started by ${username}`
  };

  data.startFrom = job ? job.name : '~commit';

  if (prNum) {
    data.startFrom = '~pr';
    data.prNum = prNum;
  }

  if (event) {
    data.groupEventId = event.groupEventId;
    data.parentEventId = event.id;
  }

  if (parameters) {
    data.meta = { parameters };
  }

  if (isFrozen) {
    data.causeMessage = `[force start]${reason}`;
  }

  return data;
}
