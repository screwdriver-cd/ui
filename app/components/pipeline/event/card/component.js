import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { getStatus } from 'screwdriver-ui/utils/pipeline/event';
import {
  getDurationText,
  getFailureCount,
  getExternalPipelineId,
  getStartDate,
  getTruncatedMessage,
  getTruncatedSha,
  getWarningCount,
  isCommitterDifferent,
  isExternalTrigger
} from './util';

export default class PipelineEventCardComponent extends Component {
  @service router;

  @service shuttle;

  @tracked status;

  @tracked isRunning;

  @tracked failureCount;

  @tracked warningCount;

  @tracked successCount;

  @tracked showParametersModal;

  @tracked showAbortBuildModal;

  constructor() {
    super(...arguments);

    const { builds } = this.args;

    this.showParametersModal = false;
    this.showAbortBuildModal = false;
    this.status = getStatus(this.args.event, builds);
    this.isRunning = this.status === 'RUNNING';
    this.failureCount = getFailureCount(builds);
    this.warningCount = getWarningCount(builds);
    this.successCount = builds.length - this.failureCount - this.warningCount;
  }

  get isHighlighted() {
    return this.router.currentURL.endsWith(this.args.event.id);
  }

  get icon() {
    return statusIcon(this.status, true);
  }

  get truncatedSha() {
    return `#${getTruncatedSha(this.args.event)}`;
  }

  get isLatestCommit() {
    return this.args.latestCommitEvent.sha === this.args.event.sha;
  }

  get truncatedMessage() {
    return getTruncatedMessage(this.args.event, 150);
  }

  get eventLabel() {
    return this.args.event.meta.label;
  }

  get startDate() {
    return getStartDate(this.args.event, this.args.userSettings);
  }

  get durationText() {
    return getDurationText(this.args.builds);
  }

  get isCommitterDifferent() {
    return isCommitterDifferent(this.args.event);
  }

  get isExternalTrigger() {
    return isExternalTrigger(this.args.event);
  }

  get externalPipelineId() {
    return getExternalPipelineId(this.args.event);
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
}
