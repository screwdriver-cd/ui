import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  errorMessage: '',
  pipeline: reads('model.pipeline'),
  secrets: reads('model.secrets'),
  pipelineTokens: reads('model.tokens'),
  pipelineId: reads('model.pipeline.id'),
  newToken: null,
  refreshService: service('pipeline.secrets'),
  actions: {
    createSecret(name, value, pipelineId, allowInPR) {
      const newSecret = this.store.createRecord('secret', { name, value, pipelineId, allowInPR });

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
    },
    createPipelineToken(name, description) {
      const newToken = this.store.createRecord('token', {
        name,
        description: description || '',
        action: 'created'
      });

      return newToken.save({ adapterOptions: { pipelineId: this.pipelineId } }).then(
        token => {
          this.set('newToken', token);
        },
        error => {
          newToken.destroyRecord({ adapterOptions: { pipelineId: this.pipelineId } });
          throw error;
        }
      );
    },
    refreshPipelineToken(tokenId) {
      return this.refreshService.refreshPipelineToken(this.pipelineId, tokenId).then(token => {
        this.set('newToken', token);
      });
    }
  }
});
