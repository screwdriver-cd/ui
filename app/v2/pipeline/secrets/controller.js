import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class NewPipelineController extends Controller {
  @service store;

  @service session;

  @service('pipeline.secrets')
  refreshService;

  @tracked newToken = '';

  @tracked newToken = null;

  get pipeline() {
    return this.model.pipeline;
  }

  get secrets() {
    return this.model.secrets;
  }

  get pipelineTokens() {
    return this.model.tokens;
  }

  get pipelineId() {
    return this.model.pipeline.id;
  }

  @action
  createSecret(name, value, pipelineId, allowInPR) {
    const newSecret = this.store.createRecord('secret', {
      name,
      value,
      pipelineId,
      allowInPR
    });

    return newSecret.save().then(
      s => {
        this.errorMessage = '';
        this.secrets.reload();

        return s;
      },
      err => {
        this.errorMessage = err.errors[0].detail;
      }
    );
  }

  @action
  createPipelineToken(name, description) {
    const newToken = this.store.createRecord('token', {
      name,
      description: description || '',
      action: 'created'
    });

    return newToken
      .save({ adapterOptions: { pipelineId: this.pipelineId } })
      .then(
        token => {
          this.newToken = token;
        },
        error => {
          newToken.destroyRecord({
            adapterOptions: { pipelineId: this.pipelineId }
          });
          throw error;
        }
      );
  }

  @action
  refreshPipelineToken(tokenId) {
    return this.refreshService
      .refreshPipelineToken(this.pipelineId, tokenId)
      .then(token => {
        this.newToken = token;
      });
  }
}
