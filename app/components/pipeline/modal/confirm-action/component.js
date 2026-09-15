import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  extractDefaultJobParameters,
  extractDefaultParameters
} from 'screwdriver-ui/utils/pipeline/parameters';
import { getPipelineErrorMessage } from 'screwdriver-ui/utils/pipeline';
import {
  buildPostBody,
  capitalizeFirstLetter,
  isParameterized,
  truncateMessage
} from './util';

export default class PipelineModalConfirmActionComponent extends Component {
  @service router;

  @service session;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('workflow-data-reload') workflowDataReload;

  @tracked errorMessage = null;

  @tracked isAwaitingResponse = false;

  @tracked wasActionSuccessful = false;

  @tracked isNotFoundError = false;

  @tracked isNoJobsToStart = false;

  @tracked reason = '';

  eventToTransitionTo = null;

  pipeline;

  parameters;

  latestCommitEvent;

  defaultPipelineParameters;

  defaultJobParameters;

  startFrom;

  jobName;

  constructor() {
    super(...arguments);

    const { job } = this.args;

    this.action = this.args.action;
    this.pipeline = this.pipelinePageState.getPipeline();
    this.latestCommitEvent =
      this.args.latestCommitEvent ||
      this.workflowDataReload.getLatestCommitEvent();

    this.defaultPipelineParameters = extractDefaultParameters(
      this.pipeline.parameters
    );
    this.defaultJobParameters = extractDefaultJobParameters(
      this.pipelinePageState.getJobs()
    );
    if (this.isFreshRunAction && !job) {
      this.startFrom = this.pipelinePageState.getIsPr() ? '~pr' : '~commit';
      this.jobName = this.startFrom;
    } else {
      this.startFrom = job.name;

      const { displayName, name } = this.args.job;

      this.jobName = displayName || name;

      if (this.jobName.startsWith('PR-')) {
        this.jobName = this.jobName.split(`PR-${this.args.event.prNum}:`)[1];
      }
    }
  }

  get truncatedMessage() {
    return truncateMessage(this.args.event.commit.message);
  }

  get isLatestCommitEvent() {
    return this.args.event?.sha === this.latestCommitEvent?.sha;
  }

  get commitUrl() {
    return this.args.event.commit.url;
  }

  get truncatedSha() {
    return this.args.event.sha.substring(0, 7);
  }

  get isNotLatestCommit() {
    if (this.startFrom === '~commit' || this.startFrom === '~pr') {
      return false;
    }
    if (!this.args.event) {
      return false;
    }
    if (!this.pipelinePageState.getIsPr() && !this.isLatestCommitEvent) {
      return true;
    }

    return false;
  }

  get isFreshRunAction() {
    return this.args.action === 'start';
  }

  get isRestartAction() {
    return this.args.action === 'restart';
  }

  get notice() {
    if (this.startFrom === '~commit' || this.startFrom === '~pr') {
      return null;
    }

    const type = this.args.stage ? 'stage' : 'job';
    const name = this.args.stage ? this.args.stage.name : this.jobName;
    const notice = `Make sure this ${type} (${name}) and any downstream jobs can be successfully completed without rerunning any upstream jobs (i.e., does this job depend on any metadata that was previously set?)`;

    return notice;
  }

  get isFrozen() {
    return this.args.job?.status === 'FROZEN';
  }

  get isParameterized() {
    return isParameterized(
      this.pipeline,
      this.defaultJobParameters,
      this.args.event
    );
  }

  get isSubmitButtonDisabled() {
    if (this.isNotFoundError) {
      return false;
    }

    if (this.isNoJobsToStart) {
      return false;
    }

    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    if (this.isFrozen) {
      return this.reason.length === 0;
    }

    return false;
  }

  get isCloseAction() {
    return this.isNotFoundError || this.isNoJobsToStart;
  }

  get pendingAction() {
    return `${capitalizeFirstLetter(this.args.action)}ing...`;
  }

  @action
  onUpdateParameters(parameters) {
    this.parameters = parameters;
  }

  @action
  onConfirm() {
    if (this.isNoJobsToStart) {
      this.args.closeModal();
      this.transitionToEvent(this.eventToTransitionTo);

      return;
    }

    if (this.isCloseAction) {
      this.args.closeModal();

      return;
    }

    this.startBuild();
  }

  @action
  onHide() {
    this.args.closeModal();
    if (this.isNoJobsToStart) {
      this.transitionToEvent(this.eventToTransitionTo);
    }
  }

  @action
  async startBuild() {
    this.isAwaitingResponse = true;
    this.isNotFoundError = false;
    this.isNoJobsToStart = false;
    this.eventToTransitionTo = null;

    const event =
      this.args.action === 'start' &&
      !this.args.job &&
      !this.pipelinePageState.getIsPr()
        ? null
        : this.args.event;
    const sha = this.args.event?.sha;

    let startAction = 'START_FROM_LATEST_COMMIT';

    if (event) {
      startAction = this.isFreshRunAction
        ? 'START_FROM_EVENT'
        : 'RESTART_FROM_EVENT';
    }

    const data = {
      pipelineId: this.pipeline.id,
      causeMessage: this.isFrozen
        ? `[force start] ${this.reason}`
        : `Manually started by ${this.session.data.authenticated.username}`,
      ...buildPostBody(
        this.startFrom,
        startAction,
        event,
        sha,
        this.args.event?.prNum,
        this.parameters
      )
    };

    await this.shuttle
      .fetchFromApi('post', '/events', data, true)
      .then(raw => {
        const newEvent = raw.response;
        const statusMessage = raw.jqXHR.getResponseHeader('X-Status-Message');

        if (statusMessage !== null) {
          this.wasActionSuccessful = false;
          this.errorMessage = statusMessage;
          this.isNoJobsToStart = true;
          this.eventToTransitionTo = newEvent;

          return;
        }
        this.args.closeModal();

        if (this.pipelinePageState.route !== 'v2.pipeline.jobs') {
          // When restarting a build from the "v2.pipeline.jobs" tab, it does not automatically transition to the 'v2.pipeline.events' tab.

          this.transitionToEvent(newEvent);
        }
      })
      .catch(err => {
        this.wasActionSuccessful = false;
        this.errorMessage = getPipelineErrorMessage(err);

        const statusCode = err?.payload?.statusCode || err?.status;

        if (statusCode === 404) {
          this.isNotFoundError = true;
        }
      })
      .finally(() => {
        this.isAwaitingResponse = false;
      });
  }

  transitionToEvent(event) {
    if (!event) {
      return;
    }

    const route = this.pipelinePageState.getIsPr()
      ? 'v2.pipeline.pulls.show'
      : 'v2.pipeline.events.show';

    this.router.transitionTo(route, {
      event,
      reloadEventRail: true,
      id: event.id
    });
  }
}
