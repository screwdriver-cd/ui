import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';

const { sort } = computed;

export default Controller.extend({
  session: service(),
  isShowingModal: false,
  errorMessage: '',
  pipeline: reads('model.pipeline'),
  jobs: reads('model.jobs'),
  events: reads('model.events'),
  pullRequests: reads('model.pullRequests'),

  eventsSorted: sort('events.[]',
    (a, b) => parseInt(b.id, 10) - parseInt(a.id, 10)),

  selectedEvent: computed('selected', 'mostRecent', {
    get() {
      return get(this, 'selected') || get(this, 'mostRecent');
    }
  }),

  selectedEventObj: computed('selectedEvent', {
    get() {
      const selected = get(this, 'selectedEvent');

      if (selected === 'aggregate') {
        return null;
      }

      return get(this, 'events').find(e => get(e, 'id') === selected);
    }
  }),

  mostRecent: computed('eventsSorted', {
    get() {
      const list = get(this, 'eventsSorted');

      if (Array.isArray(list) && list.length) {
        const id = get(list[0], 'id');

        return id;
      }

      return 0;
    }
  }),

  lastSuccessful: computed('events.@each.status', {
    get() {
      const list = get(this, 'eventsSorted') || [];
      // Reduce the number of events to look at
      const event = list.slice(0, Math.min(list.length, 15))
        .find(e => get(e, 'status') === 'SUCCESS');

      if (!event) {
        return 0;
      }

      return get(event, 'id');
    }
  }),

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
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    }
  }
});
