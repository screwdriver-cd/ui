import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';
import { inject as service } from '@ember/service';

export default Controller.extend({
  session: service(),
  errorMessage: '',
  pipeline: reads('model.pipeline'),
  secrets: reads('model.secrets'),
  actions: {
    createSecret(name, value, pipelineId, allowInPR) {
      const newSecret = this.store.createRecord('secret', { name, value, pipelineId, allowInPR });

      return newSecret.save()
        .then((s) => {
          this.set('errorMessage', '');
          this.get('secrets').reload();

          return s;
        }, (err) => {
          this.set('errorMessage', err.errors[0].detail);
        });
    }
  }
});
