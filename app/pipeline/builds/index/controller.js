import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import { reads } from '@ember/object/computed';

export default Controller.extend({
  session: service('session'),
  isShowingModal: false,
  errorMessage: '',
  pipeline: reads('model.pipeline'),
  jobs: reads('model.jobs'),
  events: reads('model.events'),
  pullRequests: reads('model.pullRequests'),

  actions: {
    startMainBuild() {
      this.set('isShowingModal', true);

      const pipelineId = this.get('pipeline.id');
      const newEvent = this.store.createRecord('event', {
        pipelineId,
        startFrom: '~commit'
      });

      return newEvent.save().then(() => {
        this.set('isShowingModal', false);

        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', e.errors[0].detail);
      });
    }
  }
});
