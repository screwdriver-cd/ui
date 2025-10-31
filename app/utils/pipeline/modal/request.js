/**
 * Build post body for starting a job
 * @param username
 * @param pipelineId
 * @param job
 * @param event
 * @param parameters
 * @param isFrozen
 * @param reason
 * @param commit
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
  sha
) {
  const data = {
    pipelineId,
    causeMessage: `Manually started by ${username}`
  };

  data.startFrom = job ? job.name : '~commit';

  if (event) {
    data.groupEventId = event.groupEventId;
    data.parentEventId = event.id;

    const { prNum } = event;

    if (prNum) {
      data.prNum = prNum;
      data.startFrom = job ? `PR-${prNum}:${job.name}` : '~pr';
    }
  } else if (sha) {
    data.sha = sha;
  }

  if (parameters) {
    data.meta = { parameters };
  }

  if (isFrozen) {
    data.causeMessage = `[force start]${reason}`;
  }

  return data;
}
