import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { reads } from '@ember/object/computed';
import { get, computed } from '@ember/object';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';

export default Controller.extend(ModelReloaderMixin, {
  eventsService: service('events'),
  session: service(),
  init() {
    this._super(...arguments);
    this.startReloading();
  },
  isShowingModal: false,
  moreToShow: true,
  errorMessage: '',
  pipeline: reads('model.pipeline'),
  jobs: reads('model.jobs'),
  events: reads('model.events'),
  pullRequests: reads('model.pullRequests'),

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

  mostRecent: computed('events.[]', {
    get() {
      const list = get(this, 'events');

      if (Array.isArray(list) && list.length) {
        const id = get(list[0], 'id');

        return id;
      }

      return 0;
    }
  }),

  lastSuccessful: computed('events.@each.status', {
    get() {
      const list = get(this, 'events') || [];
      const event = list.find(e => get(e, 'status') === 'SUCCESS');

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
        this.forceReload();

        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    },
    startDetachedBuild(job) {
      const buildId = get(job, 'buildId');
      let parentBuildId = null;

      if (buildId) {
        const build = this.store.peekRecord('build', buildId);

        parentBuildId = get(build, 'parentBuildId');
      }

      const event = get(this, 'selectedEventObj');
      const parentEventId = get(event, 'id');
      const startFrom = get(job, 'name');
      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const causeMessage =
        `${user} clicked restart for job "${job.name}" for sha ${get(event, 'sha')}`;
      const newEvent = this.store.createRecord('event', {
        buildId,
        pipelineId,
        startFrom,
        parentBuildId,
        parentEventId,
        causeMessage
      });

      this.set('isShowingModal', true);

      return newEvent.save().then(() => {
        this.set('isShowingModal', false);
        this.forceReload();

        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    },
    updateEvents(page) {
      return get(this, 'eventsService').getEvents({
        page,
        count: ENV.APP.NUM_EVENTS_LISTED,
        pipelineId: get(this, 'pipeline.id')
      })
        .then((nextEvents) => {
          if (Array.isArray(nextEvents)) {
            if (nextEvents.length < ENV.APP.NUM_EVENTS_LISTED) {
              this.set('moreToShow', false);
            }

            this.set('model.events', this.get('events').concat(nextEvents));
          }
        });
    }
  },
  willDestroy() {
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
