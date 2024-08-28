import Controller from '@ember/controller';
import { service } from '@ember/service';
import { get, set, action } from '@ember/object';
import moment from 'moment';
import { isInactivePipeline } from 'screwdriver-ui/utils/pipeline';
import {
  createEvent,
  stopBuild,
  updateEvents
} from 'screwdriver-ui/components/pipeline-events/component';
import ENV from 'screwdriver-ui/config/environment';
import ModelReloaderMixin, {
  SHOULD_RELOAD_SKIP,
  SHOULD_RELOAD_YES
} from 'screwdriver-ui/mixins/model-reloader';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { jwtDecode } from 'jwt-decode';

const PAST_TIME = moment().subtract(1, 'day');

// what interactivity needed here and what are the derived properties needed?

export default class NewPipelineEventsController extends Controller.extend(
  ModelReloaderMixin
) {
  @service session;

  @service router;

  @service shuttle;

  @service store;

  showListView = true;

  lastRefreshed = moment();

  isShowingModal = false;

  isFetching = false;

  activeTab = 'events';

  moreToShow = true;

  errorMessage = '';

  jobsDetails = [];

  paginateEvents = [];

  reloadTimeout = ENV.APP.EVENT_RELOAD_TIMER;

  eventsPage = 1;

  listViewOffset = 0;

  showDownstreamTriggers = false;

  constructor() {
    super(...arguments);
    this.startReloading();
  }

  // todo: users authentication or session
  // todo: side effects of not using computed
  // todo: tests
  // todo: passing multiple things to the linkto

  shouldReload(model) {
    const job = model.jobs.find(j => {
      if (j.builds.length > 0) {
        console.log('j.builds: ', j.builds);

        return j.builds.find(b => {
          return isActiveBuild(b.status, b.endTime);
        });
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
  }

  async reload() {
    try {
      this.send('refreshModel');
      await this.refreshListViewJobs();
    } catch (e) {
      return Promise.resolve(e);
    } finally {
      set(this, 'lastRefreshed', moment());
    }

    return Promise.resolve();
  }

  get pipeline() {
    return this.model.pipeline;
  }

  get jobs() {
    // need await here to get the jobs from the model because it is async
    return this.model.jobs;
  }

  get jobIds() {
    console.log('this.model.jobs: ', this.model.jobs);

    return this.model.jobs.map(j => j.id);
  }

  get isInactivePipeline() {
    return isInactivePipeline(this.pipeline);
  }

  set isInactivePipeline(value) {
    this._isInactivePipeline = value;
  }

  @action
  setShowListView(showListView) {
    if (!showListView) {
      this.router.transitionTo('v2.pipeline.events');
    }
  }

  @action
  setDownstreamTrigger() {
    set(this, 'showDownstreamTriggers', !this.showDownstreamTriggers);
  }

  @action
  async updateEvents(page) {
    await updateEvents(this, page);
  }

  @action
  async updateListViewJobs() {
    let { jobsDetails } = this;

    if (jobsDetails.length === 0) {
      set(this, 'listViewOffset', 0);
    }

    const { listViewOffset } = this;
    const listViewCutOff = listViewOffset + ENV.APP.LIST_VIEW_PAGE_SIZE;
    const nextJobsDetails = await this.getNewListViewJobs(
      listViewOffset,
      listViewCutOff
    );

    return new Promise(resolve => {
      if (nextJobsDetails.length > 0) {
        set(this, 'listViewOffset', listViewCutOff);
        set(this, 'jobsDetails', jobsDetails.concat(nextJobsDetails));
      }
      resolve(nextJobsDetails);
    });
  }

  async getNewListViewJobs(listViewOffset, listViewCutOff) {
    const { jobIds, jobs } = this;

    console.log('jobIds from getNewListViewJobs: ', jobIds);
    console.log('jobs from getNewListViewJobs: ', jobs);
    if (listViewOffset < jobIds.length) {
      const jobsDetails = this.model.jobs
        .slice(listViewOffset, listViewCutOff)
        .map(job => ({ ...job }));

      console.log('jobsDetails from getNewListViewJobs: ', jobsDetails);
      const nextJobsDetails = [];

      jobsDetails.forEach(nextJobDetail => {
        if (nextJobDetail.builds) {
          nextJobDetail.builds.forEach(build => {
            if (build?.meta?.build?.warning && build.status === 'SUCCESS') {
              build.status = 'WARNING';
            }
          });
        }

        nextJobDetail.jobId = nextJobDetail.id;
        nextJobDetail.jobName = nextJobDetail.name;
        nextJobDetail.jobPipelineId = nextJobDetail.pipelineId;
        nextJobDetail.annotations = nextJobDetail.permutations[0].annotations;
        // PR-specific
        nextJobDetail.prParentJobId = nextJobDetail.prParentJobId || null;
        nextJobDetail.prNum = nextJobDetail.group || null;
        nextJobsDetails.push(nextJobDetail);
      });

      return nextJobsDetails;
    }

    return Promise.resolve([]);
  }

  @action
  async refreshListViewJobs() {
    console.log('refreshListViewJobs');
    const listViewCutOff = this.listViewOffset;

    if (listViewCutOff > 0) {
      const updatedJobsDetails = await this.getNewListViewJobs(
        0,
        listViewCutOff
      );

      set(this, 'jobsDetails', updatedJobsDetails);
    }

    return this.jobsDetails;
  }

  @action
  async startSingleBuild(jobId, jobName, buildState = undefined, parameters) {
    set(this, 'isShowingModal', true);

    const pipelineId = this.pipeline.id;
    const token = get(this, 'session.data.authenticated.token');
    const user = jwtDecode(token).username;
    const causeMessage = `Manually started by ${user}`;

    let startFrom = jobName;

    let eventPayload;

    if (buildState === 'RESTART') {
      const latestBuild = await this.shuttle.fetchFromApi(
        'get',
        `/jobs/${jobId}/latestBuild`
      );
      const event = await this.shuttle.fetchFromApi(
        'get',
        `/events/${latestBuild.eventId}`
      );

      const buildId = latestBuild.id;
      const { parentBuildId } = latestBuild;
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
    await createEvent.bind(this)(eventPayload);
    set(this, 'lastRefreshed', PAST_TIME);
  }

  @action
  async stopBuild(givenEvent, job) {
    await stopBuild.bind(this)(givenEvent, job);
    await this.reload();
    set(this, 'lastRefreshed', PAST_TIME);
  }

  willDestroy() {
    // FIXME: Never called when route is no longer active
    this.stopReloading();
  }
}
