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
  getFailureCount,
  getFirstCreateTime,
  getExternalPipelineId,
  getStartDate,
  getRunningDurationText,
  getTruncatedMessage,
  getTruncatedSha,
  getWarningCount,
  isCommitterDifferent,
  isExternalTrigger
} from './util';

export default class PipelineEventCardComponent extends Component {
  @service router;

  @service workflowDataReload;

  @tracked event;

  @tracked builds;

  @tracked latestCommitEvent;

  @tracked status;

  @tracked failureCount;

  @tracked warningCount;

  @tracked successCount;

  @tracked durationText;

  @tracked showParametersModal;

  @tracked showAbortBuildModal;

  @tracked showEventHistoryModal;

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
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.workflowDataReload.removeCallback(this.queueName, this.event.id);

    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
    }
    this.durationIntervalId = null;
  }

  @action
  initialize() {
    this.workflowDataReload.registerCallback(
      this.queueName,
      this.event.id,
      this.buildsCallback
    );
  }

  @action
  update(element, [event]) {
    this.workflowDataReload.removeCallback(this.queueName, this.event.id);

    this.event = event;

    if (this.durationIntervalId) {
      clearInterval(this.durationIntervalId);
    }
    this.durationIntervalId = null;
    this.durationText = null;
    this.firstCreateTime = null;

    this.workflowDataReload.registerCallback(
      this.queueName,
      this.event.id,
      this.buildsCallback
    );
  }

  @action
  buildsCallback(builds, latestCommitEvent) {
    const isEventComplete = isComplete(builds);

    if (isSkipped(this.event, builds) || isEventComplete) {
      this.workflowDataReload.removeCallback(this.queueName, this.event.id);

      if (this.durationIntervalId) {
        clearInterval(this.durationIntervalId);
      }
      this.durationIntervalId = null;

      this.durationText = getDurationText(builds);
    }

    this.builds = builds;
    this.latestCommitEvent = latestCommitEvent;
    this.status = getStatus(this.event, builds);

    if (this.status !== 'COLLAPSED') {
      this.failureCount = getFailureCount(builds);
      this.warningCount = getWarningCount(builds);
      this.successCount = builds.length - this.failureCount - this.warningCount;
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

  get isHighlighted() {
    return this.router.currentURL.endsWith(this.event.id);
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
}
