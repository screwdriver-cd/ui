import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin from 'screwdriver-ui/mixins/model-reloader';
import { isPRJob } from 'screwdriver-ui/utils/build';
import {
  createEvent,
  startDetachedBuild,
  startSingleBuild,
  stopBuild,
  updateEvents
} from '../../events/controller';

export default Controller.extend(ModelReloaderMixin, {
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
  paginateEvents: [],
  updateEvents,
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
              nextJobDetail.annotations = job.annotations;
              // PR-specific
              nextJobDetail.prParentJobId = job.prParentJobId || null;
              nextJobDetail.prNum = job.group || null;
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
    }

    if (jobsDetails.length === 0) {
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
    startSingleBuild,
    stopBuild
  },
  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  },
  reloadTimeout: ENV.APP.EVENT_RELOAD_TIMER
});
