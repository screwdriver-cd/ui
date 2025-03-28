import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isActivePipeline } from 'screwdriver-ui/utils/pipeline';
import { getTooltipData } from 'screwdriver-ui/utils/pipeline/graph/tooltip';
import { canJobStart } from 'screwdriver-ui/utils/pipeline-workflow';

export default class PipelineWorkflowTooltipComponent extends Component {
  @service router;

  @service session;

  @service pipelinePageState;

  @tracked showToggleJobModal = false;

  @tracked toggleJobMeta;

  @tracked isDescriptionClicked = false;

  @tracked showConfirmActionModal = false;

  @tracked showStopBuildModal = false;

  pipeline;

  tooltipData = null;

  viewDescriptionMaxLength = 25;

  constructor() {
    super(...arguments);

    this.pipeline = this.pipelinePageState.getPipeline();
    this.tooltipData = getTooltipData(
      this.args.d3Data.node,
      this.args.event,
      this.pipelinePageState.getJobs(),
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
    return this.session.isAuthenticated && isActivePipeline(this.pipeline);
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

  @action
  setTooltipPosition(element) {
    const { d3Event } = this.args.d3Data;

    const workflowGraphElement = document.getElementById('workflow-graph');

    if (workflowGraphElement && d3Event.target) {
      const workflowGraphRect = workflowGraphElement.getBoundingClientRect();
      const nodeRect = d3Event.target.getBoundingClientRect();

      const x = nodeRect.width / 2 + nodeRect.x;
      const y = nodeRect.height + nodeRect.y;

      // The constants below are from the CSS style sheet
      const padding = 14;
      const borderWidth = 2;
      const triangleWidth = 13;

      element.style.top = `${
        y - workflowGraphRect.y + padding + triangleWidth
      }px`;
      element.style.left = `${
        x - workflowGraphRect.x - padding - borderWidth - triangleWidth
      }px`;
    }
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
