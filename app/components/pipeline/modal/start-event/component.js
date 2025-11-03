import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  extractDefaultJobParameters,
  extractDefaultParameters
} from 'screwdriver-ui/utils/pipeline/parameters';
import buildPostBody from 'screwdriver-ui/utils/pipeline/modal/request';

export default class PipelineModalStartEventComponent extends Component {
  @service router;

  @service session;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  defaultPipelineParameters = {};

  defaultJobParameters = {};

  pipeline;

  parameters;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();

    this.defaultPipelineParameters = extractDefaultParameters(
      this.pipeline.parameters
    );
    this.defaultJobParameters = extractDefaultJobParameters(
      this.pipelinePageState.getJobs()
    );
  }

  get isParameterized() {
    return (
      Object.keys(this.defaultPipelineParameters).length > 0 ||
      Object.keys(this.defaultJobParameters).length > 0
    );
  }

  get isSubmitButtonDisabled() {
    return this.wasActionSuccessful || this.isAwaitingResponse;
  }

  @action
  onUpdateParameters(parameters) {
    this.parameters = parameters;
  }

  @action
  async startBuild() {
    this.isAwaitingResponse = true;

    const data = buildPostBody({
      username: this.session.data.authenticated.username,
      pipelineId: this.pipeline.id,
      job: this.args.job,
      event: this.args.event,
      parameters: this.parameters,
      isFrozen: false,
      reason: null,
      prNum: this.args.event?.prNum
    });

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(event => {
        this.args.closeModal();

        const route = this.pipelinePageState.getIsPr()
          ? 'v2.pipeline.pulls.show'
          : 'v2.pipeline.events.show';

        this.router.transitionTo(route, {
          event,
          reloadEventRail: true,
          id: event.id
        });
      })
      .catch(err => {
        this.wasActionSuccessful = false;
        this.errorMessage = err.message;
      })
      .finally(() => {
        this.isAwaitingResponse = false;
      });
  }
}
