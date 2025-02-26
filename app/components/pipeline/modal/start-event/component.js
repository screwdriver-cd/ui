import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  extractDefaultJobParameters,
  extractDefaultParameters
} from 'screwdriver-ui/utils/pipeline/parameters';
import { buildPostBody } from 'screwdriver-ui/utils/pipeline/modal/request';

export default class PipelineModalStartEventComponent extends Component {
  @service router;

  @service shuttle;

  @service session;

  @service pipelinePageState;

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
    this.defaultJobParameters = extractDefaultJobParameters(this.args.jobs);
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

    const data = buildPostBody(
      this.session.data.authenticated.username,
      this.pipeline.id,
      this.args.job,
      this.args.event,
      this.parameters,
      false,
      null
    );

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(event => {
        this.args.closeModal();

        if (this.router.currentRouteName === 'v2.pipeline.events.show') {
          this.router.transitionTo('v2.pipeline.events.show', {
            event,
            reloadEventRail: true,
            id: event.id
          });
        } else if (this.router.currentRouteName === 'v2.pipeline.pulls.show') {
          this.router.transitionTo('v2.pipeline.pulls.show', {
            event,
            reloadEventRail: true,
            id: event.prNum,
            pull_request_number: event.prNum,
            sha: event.sha
          });
        }
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
