import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { get, set, computed } from '@ember/object';
import { jwtDecode } from 'jwt-decode';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin, {
  SHOULD_RELOAD_SKIP,
  SHOULD_RELOAD_YES
} from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob, isActiveBuild } from 'screwdriver-ui/utils/build';
import moment from 'moment';
import {
  createEvent,
  stopBuild,
  updateEvents
} from 'screwdriver-ui/components/pipeline-events/component';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';

const PAST_TIME = moment().subtract(1, 'day');

export default Controller.extend(ModelReloaderMixin, {
  store: service(),
  router: service(),
  lastRefreshed: moment(),
  shouldReload(model) {
    const job = model.jobs.find(j => {
      if (j.hasMany('builds').value() !== null) {
        return j.builds.find(b =>
          isActiveBuild(b.get('status'), b.get('endTime'))
        );
      }

      return null;
    });

    let res;

    const { lastRefreshed } = this;
    const diff = moment().diff(lastRefreshed, 'milliseconds');

    if (job) {
      res = SHOULD_RELOAD_YES;
    } else if (diff > this.reloadTimeout * 2) {
      res = SHOULD_RELOAD_YES;
    } else {
      res = SHOULD_RELOAD_SKIP;
    }

    return res;
  },
  jobId: '',
  session: service(),
  stop: service('event-stop'),
  defaultNumBuilds: ENV.APP.NUM_BUILDS_LISTED,
  init() {
    this._super(...arguments);
    this.startReloading();
    this.setProperties({
      eventsPage: 1,
      listViewOffset: 0,
      showDownstreamTriggers: false,
      numBuilds: this.defaultNumBuilds
    });
  },

  async reload() {
    try {
      this.send('refreshModel');
      await this.refreshListViewJobs();
    } catch (e) {
      return Promise.resolve(e);
    } finally {
      this.set('lastRefreshed', moment());
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
      const jobs =
        this.get('model.jobs') === undefined ? [] : this.get('model.jobs');

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
  paginateEvents: [],
  updateEvents,
  async getNewListViewJobs(listViewOffset, listViewCutOff) {
    const { jobIds } = this;

    if (listViewOffset < jobIds.length) {
      const jobsDetails = await Promise.all(
        jobIds.slice(listViewOffset, listViewCutOff).map(async jobId =>
          this.store
            .query('build-history', {
              jobIds: jobId,
              offset: 0,
              numBuilds: this.numBuilds
            })
            .catch(() => Promise.resolve([]))
        )
      );

      const nextJobsDetails = [];

      jobsDetails.toArray().forEach(nextJobDetails => {
        nextJobDetails.forEach(nextJobDetail => {
          const job = this.get('pipeline.jobs').find(
            j => j.id === String(nextJobDetail.jobId)
          );

          if (nextJobDetail.builds) {
            nextJobDetail.builds.forEach(build => {
              if (build?.meta?.build?.warning && build.status === 'SUCCESS') {
                build.status = 'WARNING';
              }
            });
          }

          if (job) {
            nextJobDetail.jobName = job.name;
            nextJobDetail.jobPipelineId = job.pipelineId;
            nextJobDetail.annotations = job.annotations;
            nextJobDetail.stageName = job.stageName;

            // PR-specific
            nextJobDetail.prParentJobId = job.prParentJobId || null;
            nextJobDetail.prNum = job.group || null;
            nextJobDetail.isVirtualJob = job.virtualJob;
          }
          nextJobsDetails.push(nextJobDetail);
        });
      });

      return nextJobsDetails;
    }

    return Promise.resolve([]);
  },

  async refreshListViewJobs() {
    const listViewCutOff = this.listViewOffset;

    if (listViewCutOff > 0) {
      const updatedJobsDetails = await this.getNewListViewJobs(
        0,
        listViewCutOff
      );

      this.set('jobsDetails', updatedJobsDetails);
    }

    return this.jobsDetails;
  },

  async updateListViewJobs() {
    // purge unmatched pipeline jobs
    let { jobsDetails } = this;

    if (
      jobsDetails.some(j => j.get('jobPipelineId') !== this.get('pipeline.id'))
    ) {
      jobsDetails = [];
    }

    if (jobsDetails.length === 0) {
      this.set('listViewOffset', 0);
    }

    const { listViewOffset } = this;
    const listViewCutOff = listViewOffset + ENV.APP.LIST_VIEW_PAGE_SIZE;
    const nextJobsDetails = await this.getNewListViewJobs(
      listViewOffset,
      listViewCutOff
    );

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
  createEvent,
  showListView: true,

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
    setShowListView(showListView) {
      if (!showListView) {
        this.router.transitionTo('pipeline.events');
      }
    },
    setDownstreamTrigger() {
      this.set('showDownstreamTriggers', !this.showDownstreamTriggers);
    },
    async updateEvents(page) {
      await this.updateEvents(page);
    },
    async refreshListViewJobs() {
      return this.refreshListViewJobs();
    },
    async updateListViewJobs() {
      return this.updateListViewJobs();
    },
    async startSingleBuild(jobId, jobName, buildState = undefined, parameters) {
      this.set('isShowingModal', true);

      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = jwtDecode(token).username;

      const causeMessage = `Manually started by ${user}`;

      let startFrom = jobName;

      let eventPayload;

      if (buildState === 'RESTART') {
        const buildQueryConfig = { jobId };

        const build = await this.store.queryRecord('build', buildQueryConfig);
        const event = await this.store.findRecord('event', build.eventId);

        const buildId = build.id;
        const { parentBuildId } = build;
        const parentEventId = event.id;
        const { prNum } = event;

        if (prNum) {
          // PR-<num>: prefix is needed, if it is a PR event.
          startFrom = `PR-${prNum}:${startFrom}`;
        }

        eventPayload = {
          buildId,
          pipelineId,
          startFrom,
          parentBuildId,
          parentEventId,
          causeMessage
        };
      } else {
        eventPayload = {
          pipelineId,
          startFrom,
          causeMessage
        };
      }

      if (parameters) {
        eventPayload.meta = { parameters };
      }

      await this.createEvent(eventPayload);
      set(this, 'lastRefreshed', PAST_TIME);
    },
    stopBuild: async function stopBuildFunc(givenEvent, job) {
      await stopBuild.bind(this)(givenEvent, job);
      await this.reload();
      set(this, 'lastRefreshed', PAST_TIME);
    },
    updateNumBuilds(count) {
      this.set('numBuilds', count);
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
