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

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  defaultPipelineParameters = {};

  defaultJobParameters = {};

  parameters;

  constructor() {
    super(...arguments);

    this.defaultPipelineParameters = extractDefaultParameters(
      this.args.pipeline.parameters
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

    const { isRestrictPR } = this.args;
    const prNum = isRestrictPR ? this.args.event.prNum : null;
    const event = isRestrictPR ? this.args.event : null;

    const data = buildPostBody(
      this.session.data.authenticated.username,
      this.args.pipeline.id,
      null,
      event,
      this.parameters,
      false,
      null,
      prNum
    );

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(newEvent => {
        this.args.closeModal();

        if (this.router.currentRouteName === 'v2.pipeline.events.show') {
          this.router.transitionTo('v2.pipeline.events.show', {
            newEvent,
            reloadEventRail: true,
            id: newEvent.id
          });
        } else if (this.router.currentRouteName === 'v2.pipeline.pulls.show') {
          this.router.transitionTo('v2.pipeline.pulls.show', {
            newEvent,
            reloadEventRail: true,
            id: newEvent.prNum,
            pull_request_number: newEvent.prNum,
            sha: newEvent.sha
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
