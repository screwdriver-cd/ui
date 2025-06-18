import Component from '@ember/component';
import { computed, get, set } from '@ember/object';
import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { jwtDecode } from 'jwt-decode';
import uniqBy from 'lodash.uniqby';
import moment from 'moment';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob } from 'screwdriver-ui/utils/build';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';
import {
  SHOULD_RELOAD_SKIP,
  SHOULD_RELOAD_YES
} from '../../mixins/model-reloader';
import { isStageSetupJob, isStageTeardownJob } from '../../utils/graph-tools';

const SD_SCHEDULER = 'Screwdriver scheduler';

// eslint-disable-next-line require-jsdoc
export async function stopBuild(givenEvent, job) {
  const { buildId } = job;

  let build;

  let event = givenEvent;

  if (buildId) {
    build = this.store.peekRecord('build', buildId);
    build.set('status', 'ABORTED');

    if (!event && this.modelEvents) {
      event = this.modelEvents.filter(e => e.id === build.eventId);
    }

    try {
      await build.save();
      if (this.refreshListViewJobs) {
        await this.refreshListViewJobs();
      }

      if (event) {
        event.hasMany('builds').reload();
      }
    } catch (e) {
      this.set(
        'errorMessage',
        Array.isArray(e.errors) ? e.errors[0].detail : ''
      );
    }
  }
}

// eslint-disable-next-line require-jsdoc
export async function startDetachedBuild(job, options = {}, stage) {
  this.set('isShowingModal', true);

  let event = this.selectedEventObj;

  let parentBuildId = null;

  const { buildId } = job;
  const { parameters, reason } = options;

  if (buildId) {
    const build = this.store.peekRecord('build', buildId);

    parentBuildId = build.parentBuildId;
  } else if (event === undefined) {
    const builds = await job.builds;
    const latestBuild = builds.firstObject;

    event = await this.store.findRecord('event', latestBuild.eventId);
  }

  const parentEventId = event.id;
  const { groupEventId } = event;
  const pipelineId = get(this, 'pipeline.id');
  const token = get(this, 'session.data.authenticated.token');
  const user = jwtDecode(token).username;

  let causeMessage = `Manually started by ${user}`;
  const { prNum } = event;

  let startFrom = stage ? `stage@${stage.name}` : job.name;

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

  await this.createEvent(eventPayload, true);
}

// eslint-disable-next-line require-jsdoc
export async function createEvent(eventPayload, toActiveTab) {
  const newEvent = this.store.createRecord('event', eventPayload);

  try {
    await newEvent.save();
    if (this.refreshListViewJobs) {
      await this.refreshListViewJobs();
    }

    this.set('isShowingModal', false);
    this.forceReload();

    if (toActiveTab === true && this.activeTab === 'pulls') {
      return this.router.transitionTo(
        'pipeline.pulls',
        newEvent.get('pipelineId')
      );
    }

    if (this.showListView !== true) {
      return this.router.transitionTo('pipeline', newEvent.get('pipelineId'));
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log('***** error', e);
    this.set('isShowingModal', false);
    this.set('errorMessage', Array.isArray(e.errors) ? e.errors[0].detail : '');
  } finally {
    await this.reload();
  }

  return null;
}

// eslint-disable-next-line require-jsdoc
export async function updateEvents(page) {
  if (this.currentEventType === 'pr') {
    return null;
  }

  this.set('isFetching', true);

  const events = await this.store.query('event', {
    pipelineId: get(this, 'pipeline.id'),
    page,
    count: ENV.APP.NUM_EVENTS_LISTED
  });
  const nextEvents = events.toArray();

  if (Array.isArray(nextEvents)) {
    if (nextEvents.length < ENV.APP.NUM_EVENTS_LISTED) {
      this.set('moreToShow', false);
    }

    this.set('eventsPage', page);
    this.set('isFetching', false);

    // Skip duplicate ones if new events got added to the head of the events list
    const noDuplicateEvents = nextEvents.filter(
      nextEvent => !this.paginateEvents.findBy('id', nextEvent.id)
    );

    this.paginateEvents.pushObjects(noDuplicateEvents);
  }

  return null;
}

export default Component.extend(ModelReloaderMixin, {
  store: service(),
  router: service(),
  shuttle: service(),
  session: service(),
  // Update the job status
  jobService: service('job'),
  lastRefreshed: moment(),
  isFilteredEventsForNoBuilds: alias(
    'pipeline.settings.isFilteredEventsForNoBuilds'
  ),
  filterSchedulerEvents: alias('pipeline.settings.filterSchedulerEvents'),
  shouldReload(model) {
    let res = SHOULD_RELOAD_SKIP;

    if (this.isDestroyed || this.isDestroying) {
      const event = model.events.find(m => m.isRunning);

      let diff;
      const { lastRefreshed } = this;

      if (event) {
        res = SHOULD_RELOAD_YES;
      } else {
        diff = moment().diff(lastRefreshed, 'milliseconds');
        if (diff > this.reloadTimeout * 2) {
          res = SHOULD_RELOAD_YES;
        } else {
          res = SHOULD_RELOAD_SKIP;
        }
      }
    }

    return res;
  },
  queryParams: [
    {
      jobId: { type: 'string' }
    }
  ],
  stop: service('event-stop'),
  sync: service(),
  init() {
    this._super(...arguments);
    this.startReloading();
    this.set('eventsPage', 1);
  },

  reload() {
    try {
      this.refresh();
    } catch (e) {
      return Promise.resolve(e);
    } finally {
      this.set('lastRefreshed', moment());
    }

    return Promise.resolve();
  },
  isFetching: false,
  moreToShow: true,
  jobs: computed('model.jobs', {
    get() {
      const jobs = this.model.jobs === undefined ? [] : this.model.jobs;

      return jobs.filter(j => !isPRJob(j.get('name')));
    }
  }),
  prJobs: computed('model.jobs', {
    get() {
      const jobs = this.model.jobs === undefined ? [] : this.model.jobs;
      const prJobs = jobs.filter(j => isPRJob(j.get('name')));

      prJobs.forEach(prJob => {
        const originalJob = jobs.find(j => j.id === prJob.prParentJobId);

        if (originalJob) {
          prJob.state = originalJob.state;
          prJob.isDisabled = originalJob.isDisabled;
        }
      });

      return prJobs;
    }
  }),
  stages: alias('model.stages'),
  // TODO: this is not being used
  jobIds: computed('pipeline.jobs', {
    get() {
      return this.get('pipeline.jobs')
        .filter(j => !isPRJob(j.get('name')))
        .map(j => j.id);
    }
  }),
  hasAdmins: computed('pipeline.admins', 'numberOfAdmins', {
    get() {
      const admins =
        this.get('pipeline.admins') === undefined
          ? {}
          : this.get('pipeline.admins');

      return Object.keys(admins).length;
    }
  }),
  jobsDetails: [],
  paginateEvents: [],
  prChainEnabled: alias('pipeline.prChain'),
  completeWorkflowGraph: computed(
    'model.triggers.@each.triggers',
    'pipeline.workflowGraph',
    {
      get() {
        const workflowGraph = this.get('pipeline.workflowGraph');
        const { triggers } = this.model;
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
        if (completeGraph) {
          set(
            completeGraph,
            'nodes',
            uniqBy(completeGraph.nodes || [], n => n.name)
          );

          completeGraph.edges = (completeGraph.edges || []).filter(e => {
            const srcFound =
              !e.src || !!completeGraph.nodes.find(n => n.name === e.src);
            const destFound =
              !e.dest || !!completeGraph.nodes.find(n => n.name === e.dest);

            return srcFound && destFound;
          });
        }

        return completeGraph;
      }
    }
  ),
  currentEventType: computed('activeTab', {
    get() {
      return this.activeTab === 'pulls' ? 'pr' : 'pipeline';
    }
  }),
  // Aggregates first page events and events via ModelReloaderMixin
  modelEvents: computed('model.events', 'pipeline.id', 'previousModelEvents', {
    get() {
      let previousModelEvents = this.previousModelEvents || [];

      const currentModelEvents = (
        this.model.events === undefined ? [] : this.model.events
      ).toArray();

      let newModelEvents = [];
      const newPipelineId = this.get('pipeline.id');

      // purge unmatched pipeline events
      if (previousModelEvents.some(e => e.pipelineId !== newPipelineId)) {
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
  pipelineEvents: computed(
    'isFilteredEventsForNoBuilds',
    'filterSchedulerEvents',
    'modelEvents',
    'paginateEvents.[]',
    'pipeline.id',
    'selected',
    {
      get() {
        const pipelineId = this.get('pipeline.id');
        const filteredPaginateEvents = this.paginateEvents.filter(
          e => e.pipelineId === pipelineId
        );

        // remove duplicate event
        const pipelineEvents = [
          ...this.modelEvents,
          ...filteredPaginateEvents
        ].uniqBy('id');

        const selectedEventId = this.selected;

        let filteredEvents = pipelineEvents;

        this.shuttle.getLatestCommitEvent(pipelineId).then(event => {
          this.set('latestCommit', event);
        });

        // filter events for no builds
        if (this.isFilteredEventsForNoBuilds) {
          filteredEvents = filteredEvents.filter((event, idx) => {
            if (event.id === selectedEventId) {
              return true;
            }

            return event.status !== 'SKIPPED' || idx === 0;
          });
        }

        // filter events created by screwdriver scheduler
        if (this.filterSchedulerEvents) {
          filteredEvents = filteredEvents.filter(event => {
            if (event.id === selectedEventId) {
              return true;
            }

            return event.creator.name !== SD_SCHEDULER;
          });
        }

        return filteredEvents;
      }
    }
  ),
  prEvents: computed('model.events.@each.workflowGraph', 'prChainEnabled', {
    get() {
      const prEvents = this.model.events
        .filter(e => e.prNum)
        .sortBy('createTime')
        .reverse();

      if (this.prChainEnabled) {
        return prEvents;
      }

      return prEvents.map(prEvent => {
        const prWorkflowGraph = prEvent.workflowGraph;
        const { nodes, edges } = prWorkflowGraph;

        const prNodes = nodes.filter(n => n.name.startsWith('~pr'));
        const uniqueNodes = [...new Set(prNodes)];
        const edgesToAdd = edges.filter(e =>
          uniqueNodes.some(n => n.name === e.src)
        );
        const nodesToAdd = uniqueNodes.concat(
          nodes.filter(n => edgesToAdd.some(e => e.dest === n.name))
        );

        const stageSetupNodes = nodesToAdd.filter(n => isStageSetupJob(n.name));
        const stageNames = stageSetupNodes.map(
          n => n.name.split(':')[0].split('@')[1]
        );

        nodes.forEach(n => {
          if (stageNames.includes(n.stageName)) {
            if (isStageTeardownJob(n.name)) {
              nodesToAdd.push(n);
            } else {
              const edge = edges.find(
                e => isStageSetupJob(e.src) && e.dest === n.name
              );

              if (edge) {
                nodesToAdd.push(n);
                edgesToAdd.push(edge);
                edgesToAdd.push({
                  src: n.name,
                  dest: `stage@${n.stageName}:teardown`
                });
              }
            }
          }
        });

        prWorkflowGraph.edges.setObjects(edgesToAdd);
        prWorkflowGraph.nodes.setObjects(nodesToAdd);

        return prEvent;
      });
    },
    set(_, newPrEvents) {
      const events = this.model.events.filter(e => !e.prNum);

      this.set('model.events', events.concat(newPrEvents));

      return newPrEvents;
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
      const jobs = this.model.jobs === undefined ? [] : this.model.jobs;

      const groups = {};

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
      const annotations =
        this.get('pipeline.annotations') === undefined
          ? {}
          : this.get('pipeline.annotations');

      return (annotations['screwdriver.cd/restrictPR'] || 'none') !== 'none';
    }
  }),
  /**
   * Selected Event's Id (integer) in a string format, i.e. '379281'
   * @param  {String} selected
   * @param  {String} mostRecent
   * @return {String}
   */
  selectedEvent: computed('selected', 'mostRecent', {
    get() {
      return this.selected || this.mostRecent;
    }
  }),

  // eslint-disable-next-line ember/require-computed-property-dependencies
  selectedEventObj: computed('selectedEvent', {
    get() {
      const selected = this.selectedEvent;

      return this.events.find(e => get(e, 'id') === selected);
    }
  }),

  mostRecent: computed('events.@each.status', {
    get() {
      const list = this.events || [];
      const event = list.find(e => e.status === 'RUNNING');

      if (!event) {
        return list.length ? list[0].id : 0;
      }

      return event.id;
    }
  }),

  lastSuccessful: computed('events.@each.status', {
    get() {
      const list = this.events || [];
      const event = list.find(e => e.status === 'SUCCESS');

      if (!event) {
        return 0;
      }

      return event.id;
    }
  }),

  updateEvents,
  async checkForMorePage({ scrollTop, scrollHeight, clientHeight }) {
    if (scrollTop + clientHeight > scrollHeight - 300) {
      await this.updateEvents(this.eventsPage + 1);
    }
  },

  createEvent,

  isInactivePipeline: computed('pipeline', {
    get() {
      return isInactivePipeline(this.get('pipeline'));
    },
    set(_, value) {
      this.set('_isInactivePipeline', value);

      return value;
    }
  }),

  actions: {
    setDownstreamTrigger() {
      this.set('showDownstreamTriggers', !this.showDownstreamTriggers);
    },
    setShowListView(showListView) {
      if (showListView) {
        this.router.transitionTo('pipeline.jobs.index');
      }
    },
    async updateEvents(page) {
      await this.updateEvents(page);
    },
    async onEventListScroll({ currentTarget }) {
      if (this.moreToShow && !this.isFetching) {
        await this.checkForMorePage(currentTarget);
      }
    },
    startMainBuild(parameters) {
      this.set('isShowingModal', true);

      const token = get(this, 'session.data.authenticated.token');
      const user = jwtDecode(token).username;
      const pipelineId = this.get('pipeline.id');

      const eventPayload = {
        pipelineId,
        startFrom: '~commit',
        causeMessage: `Manually started by ${user}`
      };

      if (parameters) {
        eventPayload.meta = { parameters };
      }

      return this.createEvent(eventPayload, false);
    },
    startDetachedBuild,
    stopBuild,
    async stopEvent(eventId) {
      let stopEventId;

      if (!eventId) {
        const event = this.selectedEventObj;

        stopEventId = event.id;
      } else {
        stopEventId = eventId;
      }

      try {
        await this.stop.stopBuilds(stopEventId);
      } catch (e) {
        this.set(
          'errorMessage',
          Array.isArray(e.errors) ? e.errors[0].detail : ''
        );
      }

      return null;
    },
    async stopPRBuilds(jobs) {
      const eventId = jobs.get('firstObject.builds.firstObject.eventId');

      try {
        await this.stop.stopBuilds(eventId);
        if (this.refreshListViewJobs) {
          await this.refreshListViewJobs();
        }
      } catch (e) {
        this.set(
          'errorMessage',
          Array.isArray(e.errors) ? e.errors[0].detail : ''
        );
      }
    },
    startPRBuild(prNum, jobs, parameters) {
      this.set('isShowingModal', true);
      const user = jwtDecode(
        this.get('session.data.authenticated.token')
      ).username;

      const eventPayload = {
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
          newEvent.get('builds').then(async () => {
            if (this.refreshListViewJobs) {
              await this.refreshListViewJobs();
            }

            this.set('isShowingModal', false);

            // PR events are aggregated by each PR jobs when prChain is enabled.
            if (this.prChainEnabled) {
              const newEvents = this.prEvents.filter(
                e => e.get('prNum') !== prNum
              );

              newEvents.unshiftObject(newEvent);

              this.set('prEvents', newEvents);
            }
          })
        )
        .catch(e => {
          this.set('isShowingModal', false);
          this.set(
            'errorMessage',
            Array.isArray(e.errors) ? e.errors[0].detail : ''
          );
        })
        .finally(() =>
          jobs.forEach(async j => {
            await j.hasMany('builds').reload();
            j.notifyPropertyChange('builds');
          })
        );
    },

    async syncAdmins() {
      this.set('syncAdmins', 'init');

      try {
        const syncPath = '';

        await this.sync.syncRequests(this.get('pipeline.id'), syncPath);
        this.set('syncAdmins', 'success');

        await this.pipeline.reload();
      } catch (e) {
        this.set('syncAdmins', 'failure');
      }
    },
    setJobState(id, state, stateChangeMessage) {
      this.jobService
        .setJobState(id, state, stateChangeMessage || ' ')
        .catch(error => this.set('errorMessage', error))
        .finally(() => this.reload());
    }
  },
  willDestroy() {
    this._super(...arguments);
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
