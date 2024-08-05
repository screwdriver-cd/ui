import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isActivePipeline } from 'screwdriver-ui/utils/pipeline';
import { getTooltipData } from 'screwdriver-ui/utils/pipeline/graph/tooltip';
import canJobStart from 'screwdriver-ui/utils/pipeline-workflow';

export default class PipelineWorkflowTooltipComponent extends Component {
  @service router;

  @service shuttle;

  @service session;

  @tracked showToggleJobModal = false;

  @tracked toggleJobMeta;

  @tracked isDescriptionClicked = false;

  @tracked showConfirmActionModal = false;

  @tracked confirmActionMeta;

  @tracked showStopBuildModal = false;

  tooltipData = null;

  viewDescriptionMaxLength = 25;

  constructor() {
    super(...arguments);

    this.tooltipData = getTooltipData(
      this.args.d3Data.node,
      this.args.event,
      this.args.jobs,
      this.args.builds
    );
  }

  get buildDetailsAvailable() {
    return (
      this.tooltipData.job?.buildId &&
      this.tooltipData.job?.status !== 'CREATED'
    );
  }

  get displayRestartButton() {
    const canRestartPipeline =
      this.session.isAuthenticated && isActivePipeline(this.args.pipeline);

    return canRestartPipeline && !this.tooltipData.job.stageName;
  }

  get canJobStartFromView() {
    const activeTab = this.router.currentRoute.name.includes('events')
      ? 'events'
      : 'pulls';

    return canJobStart(
      activeTab,
      this.args.workflowGraph,
      this.tooltipData.job.name
    );
  }

  get enableHiddenDescription() {
    return (
      this.tooltipData.job.description.length > this.viewDescriptionMaxLength
    );
  }

  get jobDescription() {
    let { description } = this.tooltipData.job;

    if (description.length > this.viewDescriptionMaxLength) {
      description = `${description.substring(
        0,
        this.viewDescriptionMaxLength
      )}...`;
    }

    return description;
  }

  get job() {
    return this.tooltipData.job;
  }

  @action
  setTooltipPosition(element) {
    const { d3Event } = this.args.d3Data;
    const { ICON_SIZE } = this.args.d3Data.sizes;

    element.style.top = `${d3Event.clientY + ICON_SIZE}px`;
    element.style.left = `${d3Event.clientX - 30}px`;
  }

  @action
  openToggleJobModal(jobAction) {
    this.showToggleJobModal = true;

    this.toggleJobMeta = {
      id: this.tooltipData.job.id,
      name: this.tooltipData.job.name,
      action: jobAction
    };
  }

  @action
  closeJobModal() {
    this.showToggleJobModal = false;
  }

  @action
  clickDescription() {
    this.isDescriptionClicked = !this.isDescriptionClicked;
  }

  @action
  openConfirmActionModal() {
    this.showConfirmActionModal = true;
  }

  @action
  closeConfirmActionModal() {
    this.showConfirmActionModal = false;
  }

  @action
  openStopBuildModal() {
    this.showStopBuildModal = true;
  }

  @action
  closeStopBuildModal() {
    this.showStopBuildModal = false;
  }
}
