/**
 * Build post body for starting a job
 * @param config
 *  @property config.username
 *  @property config.pipelineId
 *  @property config.job
 *  @property config.event
 *  @property config.parameters
 *  @property config.isFrozen
 *  @property config.reason
 *  @property config.commit
 *  @property config.prNum
 * @returns {{causeMessage: string, pipelineId}}
 */
export default function buildPostBody(config) {
  const {
    username,
    pipelineId,
    job,
    event,
    parameters,
    isFrozen,
    reason,
    sha,
    prNum
  } = config;
  const data = {
    pipelineId,
    causeMessage: `Manually started by ${username}`
  };

  data.startFrom = job ? job.name : '~commit';

  if (prNum) {
    data.prNum = prNum;
    data.startFrom = job ? `PR-${prNum}:${job.name}` : '~pr';
  }

  if (event) {
    data.groupEventId = event.groupEventId;
    data.parentEventId = event.id;
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
