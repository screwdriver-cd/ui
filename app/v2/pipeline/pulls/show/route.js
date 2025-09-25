import Route from '@ember/routing/route';
import { service } from '@ember/service';
import {
  getPrNumbers,
  newestPrNumber
} from 'screwdriver-ui/utils/pipeline/pull-request';

export default class V2PipelinePullsShowRoute extends Route {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('pr-jobs') prJobs;

  async model(params, transition) {
    const pipelineId = this.pipelinePageState.getPipelineId();
    const prNums = getPrNumbers(this.prJobs.getPullRequestJobs());

    let latestEvent;

    let { event } = transition.data;

    if (event) {
      latestEvent = event;
    } else {
      const eventId = params.event_id;

      event = await this.shuttle
        .fetchFromApi('get', `/events/${eventId}`)
        .then(response => {
          if (response.type === 'pr') {
            latestEvent = response;

            return response;
          }

          return null;
        })
        .catch(() => {
          return undefined;
        });

      if (!event) {
        const newestPrNum = newestPrNumber(prNums);

        if (newestPrNum) {
          latestEvent = await this.shuttle
            .fetchFromApi(
              'get',
              `/pipelines/${pipelineId}/events?prNum=${newestPrNum}`
            )
            .then(events => {
              return events[0];
            });
        }
      }
    }

    if (event) {
      await this.prJobs.setPipelineJobs();
    }

    this.prJobs.setPipelinePageStateJobs(event);

    const model = {
      pipelineId,
      event,
      latestEvent,
      prNums: Array.from(prNums).sort((a, b) => a - b),
      invalidEvent: event === undefined
    };

    if (transition.from) {
      const { attributes } = transition.from;

      if (attributes && attributes.pipelineId !== pipelineId) {
        model.reloadEventRail = true;
      }
    }

    return model;
  }
}
