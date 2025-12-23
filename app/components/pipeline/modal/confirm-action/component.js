import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import {
  extractDefaultJobParameters,
  extractDefaultParameters
} from 'screwdriver-ui/utils/pipeline/parameters';
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

  @tracked reason = '';

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

    if (this.args.action === 'start' && !job) {
      this.startFrom = this.pipelinePageState.getIsPr() ? '~pr' : '~commit';
      this.jobName = this.startFrom;
      this.defaultPipelineParameters = extractDefaultParameters(
        this.pipeline.parameters
      );
      this.defaultJobParameters = extractDefaultJobParameters(
        this.pipelinePageState.getJobs()
      );
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

  get notice() {
    if (this.startFrom === '~commit' || this.startFrom === '~pr') {
      return null;
    }

    const type = this.args.stage ? 'stage' : 'job';
    const name = this.args.stage ? this.args.stage.name : this.jobName;
    const notice = `Make sure this ${type} (${name}) and any downstream jobs can be successfully completed without rerunning any upstream jobs (i.e., does this job depend on any metadata that was previously set?)`;

    if (!this.pipelinePageState.getIsPr() && !this.isLatestCommitEvent) {
      return `This is NOT the latest commit. ${notice}`;
    }

    return notice;
  }

  get isFrozen() {
    return this.args.job?.status === 'FROZEN';
  }

  get isParameterized() {
    return isParameterized(this.pipeline, this.args.event);
  }

  get isSubmitButtonDisabled() {
    if (this.wasActionSuccessful || this.isAwaitingResponse) {
      return true;
    }

    if (this.isFrozen) {
      return this.reason.length === 0;
    }

    return false;
  }

  get pendingAction() {
    return `${capitalizeFirstLetter(this.args.action)}ing...`;
  }

  @action
  onUpdateParameters(parameters) {
    this.parameters = parameters;
  }

  @action
  async startBuild() {
    this.isAwaitingResponse = true;

    const event =
      this.args.action === 'start' && !this.pipelinePageState.getIsPr()
        ? null
        : this.args.event;
    const sha = this.args.event?.sha;

    const data = {
      pipelineId: this.pipeline.id,
      causeMessage: this.isFrozen
        ? `[force start] ${this.reason}`
        : `Manually started by ${this.session.data.authenticated.username}`,
      ...buildPostBody(
        this.startFrom,
        event,
        sha,
        this.args.event?.prNum,
        this.parameters
      )
    };

    await this.shuttle
      .fetchFromApi('post', '/events', data)
      .then(newEvent => {
        this.args.closeModal();

        if (this.pipelinePageState.route !== 'v2.pipeline.jobs') {
          const route = this.pipelinePageState.getIsPr()
            ? 'v2.pipeline.pulls.show'
            : 'v2.pipeline.events.show';

          // When restarting a build from the "v2.pipeline.jobs" tab, it does not automatically transition to the 'v2.pipeline.events' tab.
          this.router.transitionTo(route, {
            event: newEvent,
            reloadEventRail: true,
            id: newEvent.id
          });
        }
      })
      .catch(err => {
        this.wasActionSuccessful = false;
        this.errorMessage =
          err?.payload?.message || err?.message || 'Unknown error';
      })
      .finally(() => {
        this.isAwaitingResponse = false;
      });
  }
}
