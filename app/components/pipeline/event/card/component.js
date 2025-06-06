import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { statusIcon } from 'screwdriver-ui/utils/build';
import {
  getStatus,
  isComplete,
  isSkipped
} from 'screwdriver-ui/utils/pipeline/event';
import {
  getDurationText,
  getExternalPipelineId,
  getFailureCount,
  getFirstCreateTime,
  getRunningDurationText,
  getStartDate,
  getSuccessCount,
  getTruncatedMessage,
  getTruncatedSha,
  getWarningCount,
  isCommitterDifferent,
  isExternalTrigger
} from './util';

export default class PipelineEventCardComponent extends Component {
  @service router;

  @service('workflow-data-reload') workflowDataReload;

  @service('pipeline-page-state') pipelinePageState;

  @service('pr-jobs') prJobs;

  @tracked event;

  @tracked builds;

  @tracked latestCommitEvent;

  @tracked status;

  @tracked aggregateStatus;

  @tracked hideCard;

  @tracked failureCount;

  @tracked warningCount;

  @tracked successCount;

  @tracked durationText;

  @tracked showParametersModal;

  @tracked showAbortBuildModal;

  @tracked showEventHistoryModal;

  @tracked showStartEventModal;

  queueName;

  userSettings;

  durationIntervalId;

  firstCreateTime;

  constructor() {
    super(...arguments);

    this.queueName = this.args.queueName;
    this.userSettings = this.args.userSettings;

    this.event = this.args.event;

    this.showParametersModal = false;
    this.showAbortBuildModal = false;
    this.hideCard = false;
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.workflowDataReload.removeLatestCommitEventCallback(
      this.queueName,
      this.event.id
    );
    this.workflowDataReload.removeBuildsCallback(this.queueName, this.event.id);

    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
    }
    this.durationIntervalId = null;
  }

  @action
  initialize() {
    this.workflowDataReload.registerLatestCommitEventCallback(
      this.queueName,
      this.event.id,
      this.latestCommitEventCallback
    );
    this.workflowDataReload.registerBuildsCallback(
      this.queueName,
      this.event.id,
      this.buildsCallback
    );
  }

  @action
  update(element, [event]) {
    this.workflowDataReload.removeLatestCommitEventCallback(
      this.queueName,
      this.event.id
    );
    this.workflowDataReload.removeBuildsCallback(this.queueName, this.event.id);

    this.event = event;

    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
    }
    this.durationIntervalId = null;
    this.durationText = null;
    this.firstCreateTime = null;

    this.workflowDataReload.registerLatestCommitEventCallback(
      this.queueName,
      this.event.id,
      this.latestCommitEventCallback
    );
    this.workflowDataReload.registerBuildsCallback(
      this.queueName,
      this.event.id,
      this.buildsCallback
    );
  }

  @action
  latestCommitEventCallback(latestCommitEvent) {
    this.latestCommitEvent = latestCommitEvent;

    if (this.latestCommitEvent.id !== this.event.id) {
      this.workflowDataReload.removeLatestCommitEventCallback(
        this.queueName,
        this.event.id
      );
    }
  }

  @action
  buildsCallback(builds) {
    const isEventComplete = isComplete(builds);

    if (isSkipped(this.event, builds) || isEventComplete) {
      this.workflowDataReload.removeBuildsCallback(
        this.queueName,
        this.event.id
      );

      if (this.durationIntervalId) {
        clearInterval(this.durationIntervalId);
      }
      this.durationIntervalId = null;

      this.durationText = getDurationText(builds);
    }

    this.builds = builds;
    this.status = getStatus(this.event, builds);
    this.aggregateStatus = this.status;

    if (this.args.handleFilter) {
      const pipeline = this.pipelinePageState.getPipeline();

      if (pipeline.settings?.filterEventsForNoBuilds) {
        this.hideCard = !this.isHighlighted && this.status === 'SKIPPED';
      }
    }

    if (this.status !== 'COLLAPSED') {
      this.failureCount = getFailureCount(builds);
      this.warningCount = getWarningCount(builds);
      this.successCount = getSuccessCount(builds);

      if (this.warningCount > 0) {
        this.aggregateStatus = 'WARNING';
      } else if (this.failureCount > 0) {
        this.aggregateStatus = 'FAILURE';
      }
    }

    if (!this.durationIntervalId && !isEventComplete) {
      if (!this.firstCreateTime) {
        this.firstCreateTime = getFirstCreateTime(builds);
      }

      this.durationIntervalId = setInterval(() => {
        this.durationText = getRunningDurationText(
          this.firstCreateTime,
          Date.now()
        );
      }, 1000);
    }
  }

  @action
  goToEvent(e) {
    if (e.target.href) {
      e.stopPropagation();
    } else {
      if (this.isHighlighted) {
        return;
      }

      if (this.args.onClick) {
        this.args.onClick();
      }

      const { event } = this;

      const route = this.isPR
        ? 'v2.pipeline.pulls.show'
        : 'v2.pipeline.events.show';

      if (this.isPR) {
        this.prJobs.setPipelinePageStateJobs(event);
        this.router.transitionTo(route, {
          event,
          reloadEventRail: this.queueName !== 'eventRail',
          id: event.id
        });
      } else {
        this.router.transitionTo(route, {
          event,
          reloadEventRail: this.queueName !== 'eventRail',
          id: event.id
        });
      }
    }
  }

  get isPR() {
    return this.event.type === 'pr';
  }

  get prTitle() {
    return `PR-${this.event.prNum}`;
  }

  get isHighlighted() {
    return this.router.currentURL.endsWith(this.event.id);
  }

  get isOutlined() {
    const { baseEvent } = this.args;

    if (!baseEvent) {
      return false;
    }

    return this.event.id === baseEvent.id;
  }

  get title() {
    const title = `Event: ${this.event.id}`;

    if (this.event.id === this.event.groupEventId) {
      return title;
    }

    return `${title}\nGroup: ${this.event.groupEventId}`;
  }

  get icon() {
    return statusIcon(this.status, true);
  }

  get truncatedSha() {
    return `#${getTruncatedSha(this.event)}`;
  }

  get isLatestCommit() {
    return this.latestCommitEvent?.sha === this.event.sha;
  }

  get truncatedMessage() {
    return getTruncatedMessage(this.event, 150);
  }

  get eventLabel() {
    return this.event.meta.label;
  }

  get startDate() {
    return getStartDate(this.event, this.userSettings);
  }

  get isCommitterDifferent() {
    return isCommitterDifferent(this.event);
  }

  get isExternalTrigger() {
    return isExternalTrigger(this.event);
  }

  get externalPipelineId() {
    return getExternalPipelineId(this.event);
  }

  get groupHistoryButtonTitle() {
    if (this.isPR) {
      return `View event history for PR: ${this.event.prNum}`;
    }

    const groupId = this.event.parentEventId
      ? this.event.parentEventId
      : this.event.groupEventId;

    return `View event history for ${groupId}`;
  }

  @action
  openParametersModal() {
    this.showParametersModal = true;
  }

  @action
  closeParametersModal() {
    this.showParametersModal = false;
  }

  @action
  openAbortBuildModal() {
    this.showAbortBuildModal = true;
  }

  @action
  closeAbortBuildModal() {
    this.showAbortBuildModal = false;
  }

  @action
  openEventHistoryModal() {
    this.showEventHistoryModal = true;
  }

  @action
  closeEventHistoryModal() {
    this.showEventHistoryModal = false;
  }

  @action
  openStartEventModal() {
    this.showStartEventModal = true;
  }

  @action
  closeStartEventModal() {
    this.showStartEventModal = false;
  }
}
