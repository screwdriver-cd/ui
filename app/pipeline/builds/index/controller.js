import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

export default Controller.extend({
  session: service('session'),
  isShowingModal: false,
  errorMessage: '',

  actions: {
    startMainBuild() {
      this.set('isShowingModal', true);

      const pipelineId = this.get('model.pipeline.id');
      const newEvent = this.store.createRecord('event', {
        pipelineId,
        startFrom: '~commit'
      });

      return newEvent.save().then((e) => {
        this.set('isShowingModal', false);

        return this.transitionToRoute('pipeline', e.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', e.message);
      });
    }
  }
});
