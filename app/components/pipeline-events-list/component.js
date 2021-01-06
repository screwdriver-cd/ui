import { computed, get, set } from '@ember/object';
import Component from '@ember/component';
import { scheduleOnce } from '@ember/runloop';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),
  router: service(),
  errorMessage: '',
  eventsList: computed('events.[]', {
    get() {
      this.shuttle.getLatestCommitEvent(this.get('pipeline.id')).then(event => {
        this.set('latestCommit', event);
      });

      return get(this, 'events');
    }
  }),
  init() {
    this._super(...arguments);
    scheduleOnce('afterRender', this, 'updateEvents', this.eventsPage + 1);
  },
  actions: {
    eventClick(id, eventType) {
      set(this, 'selected', id);

      if (eventType !== 'pr') {
        const currentEvent = this.eventsList.findBy('id', id);
        const { pipelineId } = currentEvent;

        this.router.transitionTo('pipeline.events.show', pipelineId, id);
      }
    }
  }
});
