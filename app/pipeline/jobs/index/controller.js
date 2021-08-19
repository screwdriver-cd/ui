import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { get, set, computed } from '@ember/object';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin, {
  SHOULD_RELOAD_SKIP,
  SHOULD_RELOAD_YES
} from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob, isActiveBuild } from 'screwdriver-ui/utils/build';
import moment from 'moment';
import {
  createEvent,
  startDetachedBuild,
  stopBuild,
  updateEvents
} from '../../events/controller';

const PAST_TIME = moment().subtract(1, 'day');

export default Controller.extend(ModelReloaderMixin, {
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

    const lastRefreshed = this.get('lastRefreshed');
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
  init() {
    this._super(...arguments);
    this.startReloading();
    this.setProperties({
      eventsPage: 1,
      listViewOffset: 0,
      showDownstreamTriggers: false
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
      const jobs = this.getWithDefault('model.jobs', []);

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
    const jobIds = this.get('jobIds');

    if (listViewOffset < jobIds.length) {
      const jobsDetails = await Promise.all(
        jobIds.slice(listViewOffset, listViewCutOff).map(async jobId =>
          this.store
            .query('build-history', {
              jobIds: jobId,
              offset: 0,
              numBuilds: ENV.APP.NUM_BUILDS_LISTED
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

          if (job) {
            nextJobDetail.jobName = job.name;
            nextJobDetail.jobPipelineId = job.pipelineId;
            nextJobDetail.annotations = job.annotations;
            // PR-specific
            nextJobDetail.prParentJobId = job.prParentJobId || null;
            nextJobDetail.prNum = job.group || null;
          }
          nextJobsDetails.push(nextJobDetail);
        });
      });

      return nextJobsDetails;
    }

    return Promise.resolve([]);
  },

  async refreshListViewJobs() {
    const listViewCutOff = this.get('listViewOffset');

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
    let jobsDetails = this.get('jobsDetails');

    if (
      jobsDetails.some(j => j.get('jobPipelineId') !== this.get('pipeline.id'))
    ) {
      jobsDetails = [];
    }

    if (jobsDetails.length === 0) {
      this.set('listViewOffset', 0);
    }

    const listViewOffset = this.get('listViewOffset');
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
  actions: {
    setShowListView(showListView) {
      if (!showListView) {
        this.transitionToRoute('pipeline.events');
      }
    },
    setDownstreamTrigger() {
      this.set('showDownstreamTriggers', !this.get('showDownstreamTriggers'));
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
    startDetachedBuild,
    async startSingleBuild(jobId, jobName, buildState = undefined) {
      this.set('isShowingModal', true);

      const pipelineId = get(this, 'pipeline.id');
      const token = get(this, 'session.data.authenticated.token');
      const user = get(decoder(token), 'username');

      let causeMessage = `Manually started by ${user}`;

      let startFrom = jobName;

      let eventPayload;

      if (buildState) {
        const buildQueryConfig = { jobId };

        const build = await this.store.queryRecord('build', buildQueryConfig);
        const event = await this.store.findRecord(
          'event',
          get(build, 'eventId')
        );

        const parentBuildId = get(build, 'parentBuildId');
        const parentEventId = get(event, 'id');
        const prNum = get(event, 'prNum');

        if (prNum) {
          // PR-<num>: prefix is needed, if it is a PR event.
          startFrom = `PR-${prNum}:${startFrom}`;
        }

        eventPayload = {
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

      await this.createEvent(eventPayload);
      set(this, 'lastRefreshed', PAST_TIME);
    },
    stopBuild: async function stopBuildFunc(givenEvent, job) {
      await stopBuild.bind(this)(givenEvent, job);
      await this.reload();
      set(this, 'lastRefreshed', PAST_TIME);
    }
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
