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
  stop: service('event-stop'),
  init() {
    this._super(...arguments);
    this.startReloading();
    this.setProperties({
      eventsPage: 1,
      listViewOffset: 0,
      showDownstreamTriggers: false
    });
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
  jobIds: computed('pipeline.jobs', {
    get() {
      return this.get('pipeline.jobs')
        .filter(j => !isPRJob(j.get('name')))
        .map(j => j.id);
    }
  }),
  jobsDetails: [],
  showListView: false,
  paginateEvents: [],
  prChainEnabled: alias('pipeline.prChain'),
  completeWorkflowGraph: computed('model.triggers.@each.triggers', {
    get() {
      const workflowGraph = this.get('pipeline.workflowGraph');
      const triggers = this.get('model.triggers');
      const completeGraph = workflowGraph;

      // Add extra node if downstream triggers exist
      if (triggers && triggers.length > 0) {
        triggers.forEach(t => {
          if (t.triggers && t.triggers.length > 0) {
            completeGraph.edges.push({
              src: t.jobName,
              dest: `~sd-${t.jobName}-triggers`
            });
            completeGraph.nodes.push({
              name: `~sd-${t.jobName}-triggers`,
              triggers: t.triggers,
              status: 'DOWNSTREAM_TRIGGER'
            });
          }
        });
      }

      return completeGraph;
    }
  }),
  currentEventType: computed('activeTab', {
    get() {
      return this.activeTab === 'pulls' ? 'pr' : 'pipeline';
    }
  }),
  // Aggregates first page events and events via ModelReloaderMixin
  modelEvents: computed('model.events', {
    get() {
      let previousModelEvents = this.previousModelEvents || [];
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

      previousModelEvents = previousModelEvents.filter(
        e => !currentModelEvents.find(c => c.id === e.id)
      );

      newModelEvents = currentModelEvents.concat(previousModelEvents);

      this.set('previousModelEvents', newModelEvents);

      return newModelEvents;
    }
  }),
  pipelineEvents: computed('modelEvents', 'paginateEvents', {
    get() {
      return [].concat(this.modelEvents, this.paginateEvents);
    }
  }),
  prEvents: computed('model.events', 'prChainEnabled', {
    get() {
      if (this.prChainEnabled) {
        return this.get('model.events')
          .filter(e => e.prNum)
          .sortBy('createTime')
          .reverse();
      }

      return [];
    }
  }),
  events: computed('pipelineEvents', 'prEvents', 'currentEventType', {
    get() {
      if (this.currentEventType === 'pr') {
        return this.prEvents;
      }

      return this.pipelineEvents;
    }
  }),
  pullRequestGroups: computed('model.jobs', {
    get() {
      const jobs = this.get('model.jobs');
      let groups = {};

      return jobs
        .filter(j => j.get('isPR'))
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
      return this.selected || this.mostRecent;
    }
  }),

  selectedEventObj: computed('selectedEvent', {
    get() {
      const selected = this.selectedEvent;

      return this.events.find(e => get(e, 'id') === selected);
    }
  }),

  mostRecent: computed('events.@each.status', {
    get() {
      const list = this.events || [];
      const event = list.find(e => get(e, 'status') === 'RUNNING');

      if (!event) {
        return list.length ? get(list[0], 'id') : 0;
      }

      return get(event, 'id');
    }
  }),

  lastSuccessful: computed('events.@each.status', {
    get() {
      const list = this.events || [];
      const event = list.find(e => get(e, 'status') === 'SUCCESS');

      if (!event) {
        return 0;
      }

      return get(event, 'id');
    }
  }),

  updateEvents(page) {
    if (this.currentEventType === 'pr') {
      return null;
    }

    this.set('isFetching', true);

    return this.store
      .query('event', {
        pipelineId: get(this, 'pipeline.id'),
        page,
        count: ENV.APP.NUM_EVENTS_LISTED
      })
      .then(events => {
        const nextEvents = events.toArray();

        if (Array.isArray(nextEvents)) {
          if (nextEvents.length < ENV.APP.NUM_EVENTS_LISTED) {
            this.set('moreToShow', false);
          }

          this.set('eventsPage', page);
          this.set('isFetching', false);

          // FIXME: Skip duplicate ones if new events got added added to the head
          // of events list
          this.set('paginateEvents', this.paginateEvents.concat(nextEvents));
        }
      });
  },

  checkForMorePage({ scrollTop, scrollHeight, clientHeight }) {
    if (scrollTop + clientHeight > scrollHeight - 300) {
      this.updateEvents(this.eventsPage + 1);
    }
  },

  async getNewListViewJobs(listViewOffset, listViewCutOff) {
    const jobIds = this.get('jobIds');

    if (listViewOffset < jobIds.length) {
      return this.store
        .query('build-history', {
          jobIds: jobIds.slice(listViewOffset, listViewCutOff),
          offset: 0,
          numBuilds: ENV.APP.NUM_BUILDS_LISTED
        })
        .then(jobsDetails => {
          const nextJobsDetails = jobsDetails.toArray();

          nextJobsDetails.forEach(nextJobDetail => {
            const job = this.get('pipeline.jobs').find(j => j.id === String(nextJobDetail.jobId));

            if (job) {
              nextJobDetail.jobName = job.name;
              nextJobDetail.jobPipelineId = job.pipelineId;
            }
          });

          return nextJobsDetails;
        })
        .catch(() => {
          return Promise.resolve([]);
        });
    }

    return Promise.resolve([]);
  },

  async refreshListViewJobs() {
    const listViewCutOff = this.get('listViewOffset');

    if (listViewCutOff > 0) {
      const updatedJobsDetails = await this.getNewListViewJobs(0, listViewCutOff);

      this.set('jobsDetails', updatedJobsDetails);
    }

    return this.jobsDetails;
  },

  async updateListViewJobs() {
    // purge unmatched pipeline jobs
    let jobsDetails = this.get('jobsDetails');

    if (jobsDetails.some(j => j.get('jobPipelineId') !== this.get('pipeline.id'))) {
      jobsDetails = [];
      this.set('listViewOffset', 0);
    }

    const listViewOffset = this.get('listViewOffset');
    const listViewCutOff = listViewOffset + ENV.APP.LIST_VIEW_PAGE_SIZE;
    const nextJobsDetails = await this.getNewListViewJobs(listViewOffset, listViewCutOff);

    return new Promise(resolve => {
      if (nextJobsDetails.length > 0) {
        this.setProperties({
          listViewOffset: listViewCutOff,
          jobsDetails: jobsDetails.concat(nextJobsDetails)
        });
      }
      resolve(nextJobsDetails);
    });
  },

  createEvent(eventPayload, toActiveTab) {
    const newEvent = this.store.createRecord('event', eventPayload);

    return newEvent
      .save()
      .then(() => {
        this.refreshListViewJobs();

        this.set('isShowingModal', false);
        this.forceReload();

        if (toActiveTab) {
          const path = `pipeline/${newEvent.get('pipelineId')}/${this.activeTab}`;

          return this.transitionToRoute(path);
        }

        return this.transitionToRoute('pipeline', newEvent.get('pipelineId'));
      })
      .catch(e => {
        this.set('isShowingModal', false);
        this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
      });
  },

  actions: {
    setDownstreamTrigger() {
      this.set('showDownstreamTriggers', !this.get('showDownstreamTriggers'));
    },
    setShowListView(showListView) {
      if (!showListView) {
        this.set('listViewOffset', 0);
      }

      this.set('showListView', showListView);
    },
    updateEvents(page) {
      this.updateEvents(page);
    },
    async refreshListViewJobs() {
      return this.refreshListViewJobs();
    },
    async updateListViewJobs() {
      return this.updateListViewJobs();
    },
    onEventListScroll({ currentTarget }) {
      if (this.moreToShow && !this.isFetching) {
        this.checkForMorePage(currentTarget);
      }
    },
    startMainBuild(parameters) {
      this.set('isShowingModal', true);

      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      const pipelineId = this.get('pipeline.id');
      let eventPayload = {
        pipelineId,
        startFrom: '~commit',
        causeMessage: `Manually started by ${user}`
      };

      if (parameters) {
        eventPayload.meta = { parameters };
      }

      return this.createEvent(eventPayload, false);
    },
    startDetachedBuild(job, options = {}) {
      this.set('isShowingModal', true);

      const buildId = get(job, 'buildId');
      let parentBuildId = null;
      const { parameters, reason } = options;

      if (buildId) {
        const build = this.store.peekRecord('build', buildId);

        parentBuildId = get(build, 'parentBuildId');
      }

      const event = this.selectedEventObj;
      const parentEventId = get(event, 'id');
      const groupEventId = get(event, 'groupEventId');
      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      let causeMessage = `Manually started by ${user}`;
      const prNum = get(event, 'prNum');
      let startFrom = get(job, 'name');

      if (reason) {
        causeMessage = `[force start]${reason}`;
      }

      if (prNum) {
        // PR-<num>: prefix is needed, if it is a PR event.
        startFrom = `PR-${prNum}:${startFrom}`;
      }

      const eventPayload = {
        buildId,
        pipelineId,
        startFrom,
        parentBuildId,
        parentEventId,
        groupEventId,
        causeMessage
      };

      if (parameters) {
        eventPayload.meta = { parameters };
      }

      return this.createEvent(eventPayload, true);
    },
    startSingleBuild(jobId, jobName, status = undefined) {
      this.set('isShowingModal', true);

      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');
      let causeMessage = `[skip further]Manually started by ${user}`;
      let startFrom = jobName;

      const buildQueryConfig = { jobId };

      if (status) {
        buildQueryConfig.status = status;
      }

      return this.store
        .queryRecord('build', buildQueryConfig)
        .then(build => {
          return this.store.findRecord('event', get(build, 'eventId')).then(event => {
            const parentBuildId = get(build, 'parentBuildId');
            const parentEventId = get(event, 'id');
            const prNum = get(event, 'prNum');

            if (prNum) {
              // PR-<num>: prefix is needed, if it is a PR event.
              startFrom = `PR-${prNum}:${startFrom}`;
            }

            const eventPayload = {
              pipelineId,
              startFrom,
              parentBuildId,
              parentEventId,
              causeMessage
            };

            return this.createEvent(eventPayload, false);
          });
        })
        .catch(() => {
          const eventPayload = {
            pipelineId,
            startFrom,
            causeMessage
          };

          return this.createEvent(eventPayload, false);
        });
    },
    stopBuild(givenEvent, job) {
      const buildId = get(job, 'buildId');
      let build;
      let event = givenEvent;

      if (buildId) {
        build = this.store.peekRecord('build', buildId);
        build.set('status', 'ABORTED');

        if (!event) {
          event = this.modelEvents.filter(e => e.id === get(build, 'eventId'));
        }

        return build
          .save()
          .then(() => {
            this.refreshListViewJobs();

            if (event) {
              event.hasMany('builds').reload();
            }
          })
          .catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
      }

      return new Promise.Resolve();
    },
    stopEvent() {
      const event = get(this, 'selectedEventObj');
      const eventId = get(event, 'id');

      return this.get('stop')
        .stopBuilds(eventId)
        .then(() => {
          this.refreshListViewJobs();
        })
        .catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
    },
    stopPRBuilds(jobs) {
      const eventId = jobs.get('firstObject.builds.firstObject.eventId');

      return this.get('stop')
        .stopBuilds(eventId)
        .then(() => {
          this.refreshListViewJobs();
        })
        .catch(e => this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : ''));
    },
    startPRBuild(prNum, jobs, parameters) {
      this.set('isShowingModal', true);
      const user = get(decoder(this.get('session.data.authenticated.token')), 'username');
      let eventPayload = {
        causeMessage: `Manually started by ${user}`,
        pipelineId: this.get('pipeline.id'),
        startFrom: '~pr',
        prNum
      };

      if (parameters) {
        eventPayload.meta = { parameters };
      }

      const newEvent = this.store.createRecord('event', eventPayload);

      return newEvent
        .save()
        .then(() =>
          newEvent.get('builds').then(() => {
            this.refreshListViewJobs();

            this.set('isShowingModal', false);

            // PR events are aggregated by each PR jobs when prChain is enabled.
            if (this.prChainEnabled) {
              const newEvents = this.prEvents.filter(e => e.get('prNum') !== prNum);

              newEvents.unshiftObject(newEvent);

              this.set('prEvents', newEvents);
            }
          })
        )
        .catch(e => {
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
