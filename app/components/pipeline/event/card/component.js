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

  @service('settings') settings;

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

  durationIntervalId;

  firstCreateTime;

  previousBuilds;

  constructor() {
    super(...arguments);

    this.queueName = this.args.queueName;
    this.event = this.args.event;

    this.showParametersModal = false;
    this.showAbortBuildModal = false;
    this.hideCard = false;

    this.allowNotification = this.settings.getSettings().allowNotification;

    this.builds = [];
    this.previousBuilds = [];
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

  buildNotify(beforeStatus, nextStatus) {
    if (Notification.permission === 'granted' && this.allowNotification) {
      if (['QUEUED', 'RUNNING'].includes(beforeStatus)) {
        if (['SUCCESS', 'FAILURE', 'ABORTED'].includes(nextStatus)) {
          const screwdriverIconPath =
            '/assets/icons/android-chrome-144x144.png';
          const statusMap = {
            SUCCESS: '✅',
            FAILURE: '❌',
            ABORTED: '⛔'
          };

          const notificationIcon = statusMap[nextStatus];
          const pipeline = this.pipelinePageState.getPipeline();

          // eslint-disable-next-line no-new
          new Notification(`SD.cd ${pipeline.name}`, {
            body: `${notificationIcon} ${nextStatus}: Event ${this.event.id}`,
            icon: screwdriverIconPath
          }).onclick = () => {
            window.focus();
          };
        }
      }
    }
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
    this.previousBuilds = [];

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
    const isEventSkipped = isSkipped(this.event, builds);
    const isEventComplete = isComplete(builds, this.previousBuilds);

    if (isEventSkipped || isEventComplete) {
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

    const beforeStatus = this.status;

    this.status = getStatus(builds, isEventSkipped, isEventComplete);
    this.event.status = this.status;
    this.previousBuilds = this.builds;
    this.builds = builds;
    this.aggregateStatus = this.status;

    this.buildNotify(beforeStatus, this.status);

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

      if (this.failureCount > 0) {
        this.aggregateStatus = 'FAILURE';
      } else if (this.warningCount > 0) {
        this.aggregateStatus = 'WARNING';
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

    this.args.onEventUpdated?.(this.event);
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
          pipelineId: event.pipelineId,
          reloadEventRail: this.queueName !== 'eventRail',
          id: event.id
        });
      } else {
        this.router.transitionTo(route, {
          event,
          pipelineId: event.pipelineId,
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

  get isLastSuccessfulEvent() {
    return this.args.lastSuccessfulEvent?.id === this.event.id;
  }

  get truncatedMessage() {
    return getTruncatedMessage(this.event, 150);
  }

  get eventLabel() {
    return this.event.meta.label;
  }

  get startDate() {
    return getStartDate(this.event, this.settings.getSettings());
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
