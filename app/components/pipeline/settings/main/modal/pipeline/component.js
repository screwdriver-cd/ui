import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';

import { getCheckoutUrl } from 'screwdriver-ui/utils/git';

export default class PipelineSettingsMainModalPipelineComponent extends Component {
  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @tracked errorMessage;

  @tracked checkoutUrl;

  @tracked sourceDir;

  @tracked isAwaitingResponse = false;

  pipeline;

  originalCheckoutUrl;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();

    this.originalCheckoutUrl = getCheckoutUrl({
      appId: this.pipeline.scmRepo.name,
      scmUri: this.pipeline.scmUri
    });
    this.checkoutUrl = this.originalCheckoutUrl;
    this.sourceDir = this.pipeline.scmRepo.rootDir;
  }

  get isDisabled() {
    if (this.isAwaitingResponse) {
      return true;
    }

    return (
      this.checkoutUrl === this.originalCheckoutUrl &&
      this.sourceDir === this.pipeline.scmRepo.rootDir
    );
  }

  @action
  async updatePipeline() {
    this.isAwaitingResponse = true;

    return this.shuttle
      .fetchFromApi('put', `/pipelines/${this.pipeline.id}`, {
        checkoutUrl: this.checkoutUrl,
        rootDir: this.sourceDir
      })
      .then(pipeline => {
        this.pipelinePageState.setPipeline(pipeline);
        this.args.closeModal(true);
      })
      .catch(err => {
        this.errorMessage = err.message;
        this.isAwaitingResponse = false;
      });
  }
}
