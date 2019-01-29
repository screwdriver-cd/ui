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
    this.set('eventsPage', 1);
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
  isFetching: false,
  activeTab: 'events',
  moreToShow: true,
  errorMessage: '',
  jobs: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => !/^PR-/.test(j.get('name')));
    }
  }),
  paginateEvents: [],
  // Aggregates first page events and events via ModelReloaderMixin
  modelEvents: computed('model.events', {
    get() {
      let previousModelEvents = this.get('previousModelEvents') || [];
      let currentModelEvents = this.get('model.events').toArray();
      let newModelEvents = [];
      const newPipelineId = this.get('pipeline.id');

      // purge unmatched pipeline events
      if (previousModelEvents.some(e => e.get('pipelineId') !== newPipelineId)) {
        newModelEvents = [...currentModelEvents];

        this.set('paginateEvents', []);
        this.set('previousModelEvents', newModelEvents);
        this.set('moreToShow', true);

        return newModelEvents;
      }

      previousModelEvents = previousModelEvents
        .filter(e => !currentModelEvents.find(c => c.id === e.id));

      newModelEvents = currentModelEvents.concat(previousModelEvents);

      this.set('previousModelEvents', newModelEvents);

      return newModelEvents;
    }
  }),
  events: computed('modelEvents', 'paginateEvents', {
    get() {
      return [].concat(this.get('modelEvents'), this.get('paginateEvents'));
    }
  }),
  pullRequests: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');

      return jobs.filter(j => /^PR-/.test(j.get('name'))).sortBy('createTime').reverse();
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

  updateEvents(page) {
    this.set('isFetching', true);

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

          this.set('eventsPage', page);
          this.set('isFetching', false);

          // FIXME: Skip duplicate ones if new events got added added to the head
          // of events list
          this.set('paginateEvents',
            this.get('paginateEvents').concat(nextEvents));
        }
      });
  },

  checkForMorePage({ scrollTop, scrollHeight, clientHeight }) {
    if (scrollTop + clientHeight > scrollHeight - 300) {
      this.updateEvents(this.get('eventsPage') + 1);
    }
  },

  actions: {
    updateEvents(page) {
      this.updateEvents(page);
    },

    onEventListScroll({ currentTarget }) {
      if (this.get('moreToShow') && !this.get('isFetching')) {
        this.checkForMorePage(currentTarget);
      }
    },

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
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
