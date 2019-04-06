import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
import { alias } from '@ember/object/computed';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob } from 'screwdriver-ui/utils/build';

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

      return jobs.filter(j => !isPRJob(j.get('name')));
    }
  }),
  paginateEvents: [],
  prChainEnabled: alias('pipeline.prChain'),
  currentEventType: computed('activeTab', {
    get() {
      return this.get('activeTab') === 'pulls' ? 'pr' : 'pipeline';
    }
  }),
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
  pipelineEvents: computed('modelEvents', 'paginateEvents', {
    get() {
      return [].concat(this.get('modelEvents'), this.get('paginateEvents'));
    }
  }),
  prEvents: computed('model.events', 'prChainEnabled', {
    get() {
      if (this.get('prChainEnabled')) {
        return this.get('model.events').filter(e => e.prNum).sortBy('createTime').reverse();
      }

      return [];
    }
  }),
  events: computed('pipelineEvents', 'prEvents', 'currentEventType', {
    get() {
      if (this.get('currentEventType') === 'pr') {
        return this.get('prEvents');
      }

      return this.get('pipelineEvents');
    }
  }),
  pullRequestGroups: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');
      let groups = {};

      return jobs.filter(j => j.get('isPR'))
        .sortBy('createTime')
        .reverse()
        .reduce((results, j) => {
          const k = j.get('group');

          if (groups[k] === undefined) {
            groups[k] = results.length;
            results[groups[k]] = [j];
          } else {
            results[groups[k]].push(j);
          }

          return results;
        }, []);
    }
  }),
  isRestricted: computed('pipeline.annotations', {
    get() {
      const annotations = this.getWithDefault('pipeline.annotations', {});

      return (annotations['screwdriver.cd/restrictPR'] || 'none') !== 'none';
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

  mostRecent: computed('events.@each.status', {
    get() {
      const list = get(this, 'events') || [];
      const event = list.find(e => get(e, 'status') === 'RUNNING');

      if (!event) {
        return list.length ? get(list[0], 'id') : 0;
      }

      return get(event, 'id');
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
    if (this.get('currentEventType') === 'pr') {
      return null;
    }

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

        const path = `pipeline/${newEvent.get('pipelineId')}/${this.get('activeTab')}`;

        return this.transitionToRoute(path);
      }).catch((e) => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
    },
    stopBuild(job) {
      const buildId = get(job, 'buildId');
      let build;

      if (buildId) {
        build = this.store.peekRecord('build', buildId);
        build.set('status', 'ABORTED');

        return build.save()
          .catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
      }

      return new Promise.Resolve();
    },
    startPRBuild(prNum, jobs) {
      this.set('isShowingModal', true);
      const user = get(decoder(this.get('session.data.authenticated.token')), 'username');
      const newEvent = this.store.createRecord('event', {
        causeMessage: `${user} clicked start build for PR-${prNum}`,
        pipelineId: this.get('pipeline.id'),
        startFrom: '~pr',
        prNum
      });

      return newEvent.save().then(() =>
        newEvent.get('builds').then(() => {
          this.set('isShowingModal', false);

          // PR events are aggregated by each PR jobs when prChain is enabled.
          if (this.get('prChainEnabled')) {
            const newEvents = this.get('prEvents')
              .filter(e => e.get('prNum') !== prNum);

            newEvents.unshiftObject(newEvent);

            this.set('prEvents', newEvents);
          }
        })
      )
        .catch((e) => {
          this.set('isShowingModal', false);
          this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
        })
        .finally(() => jobs.forEach(j => j.hasMany('builds').reload()));
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
