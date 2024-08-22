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
  @service shuttle;

  @service session;

  @tracked errorMessage = null;

  @tracked successMessage = null;

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

    const data = buildPostBody(
      this.session.data.authenticated.username,
      this.args.pipeline.id,
      null,
      null,
      this.parameters,
      false,
      null
    );

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(() => {
        this.wasActionSuccessful = true;
        this.successMessage = `Started successfully`;
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