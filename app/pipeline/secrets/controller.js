import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class SecretsController extends Controller {
  @service
  session;

  errorMessage = '';

  @reads('model.pipeline')
  pipeline;

  @reads('model.secrets')
  secrets;

  @reads('model.tokens')
  pipelineTokens;

  @reads('model.pipeline.id')
  pipelineId;

  newToken = null;

  @service('pipeline.secrets')
  refreshService;

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
        this.set('errorMessage', '');
        this.secrets.reload();

        return s;
      },
      err => {
        this.set('errorMessage', err.errors[0].detail);
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
          this.set('newToken', token);
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
        this.set('newToken', token);
      });
  }
}
