import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';

export default Controller.extend(ModelReloaderMixin, {
  session: service(),
  init() {
    this._super(...arguments);
    this.startReloading();
  },
  reload() {
    try {
      this.send('refreshModel');
    } catch (e) {
      return Promise.resolve(e);
    }

    return Promise.resolve();
  },
  isShowingModal: false,
  moreToShow: true,
  errorMessage: '',
  jobs: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => !/^PR-/.test(j.get('name')));
    }
  }),
  paginateEvents: [],
  initialEvents: computed('model.events', {
    get() {
      let headEvents = this.get('headEvents') || [];
      let modelEvents = this.get('model.events').toArray();

      // headEvents holds current model.events + previous mode.events
      // model.events gets updated via ModelReloaderMixin logic
      headEvents = headEvents.filter(e => !modelEvents.find(c => c.id === e.id));

      const initialEvents = modelEvents.concat(headEvents);

      this.set('headEvents', initialEvents);

      return initialEvents;
    }
  }),
  events: computed('initialEvents', 'paginateEvents', {
    get() {
      return [].concat(this.get('initialEvents'), this.get('paginateEvents'));
    }
  }),
  pullRequests: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => /^PR-/.test(j.get('name')));
    }
  }),
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
      return get(this, 'store').query('event', {
        pipelineId: get(this, 'pipeline.id'),
        page,
        count: ENV.APP.NUM_EVENTS_LISTED
      })
        .then((events) => {
          const nextEvents = events.toArray();

          if (Array.isArray(nextEvents)) {
            if (nextEvents.length < ENV.APP.NUM_EVENTS_LISTED) {
              this.set('moreToShow', false);
            }

            // FIXME: Skip duplicate ones if new events got added added to the head
            // of events list
            this.set('paginateEvents',
              this.get('paginateEvents').concat(nextEvents));
          }
        });
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
