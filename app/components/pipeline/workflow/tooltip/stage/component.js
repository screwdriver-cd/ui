import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { canJobStart } from 'screwdriver-ui/utils/pipeline-workflow';
import { getTruncatedSha } from 'screwdriver-ui/utils/git';

export default class PipelineWorkflowTooltipStageComponent extends Component {
  @service router;

  @service session;

  @tracked showConfirmActionModal = false;

  @tracked stageAction;

  get canStartStageFromView() {
    const activeTab = this.router.currentRoute.name.includes('events')
      ? 'events'
      : 'pulls';

    return canJobStart(
      activeTab,
      this.args.workflowGraph,
      this.stage.setup.name
    );
  }

  get stage() {
    return this.args.d3Data.stage;
  }

  get job() {
    const setupJob = this.stage.setup;

    return {
      ...setupJob,
      status: this.stage.status
    };
  }

  get truncatedSha() {
    return `#${getTruncatedSha(this.args.event.sha)}`;
  }

  @action
  setTooltipPosition(element) {
    const { d3Event } = this.args.d3Data;
    const workflowGraphElement = document.getElementById('workflow-graph');
    const stageMenu = d3Event.target;

    if (workflowGraphElement && stageMenu) {
      const workflowGraphRect = workflowGraphElement.getBoundingClientRect();
      const stageMenuRect = stageMenu.getBoundingClientRect();

      const x = stageMenuRect.width / 2 + stageMenuRect.x;
      const y = stageMenuRect.height + stageMenuRect.y;

      // The constants below are from the CSS style sheet
      const padding = 14;
      const borderWidth = 2;
      const triangleWidth = 13;

      element.style.top = `${y - workflowGraphRect.y + borderWidth}px`;
      element.style.left = `${
        x - workflowGraphRect.x - padding - borderWidth - triangleWidth
      }px`;
    }
  }

  @action
  openConfirmActionModal(stageAction) {
    this.stageAction = stageAction;
    this.showConfirmActionModal = true;
  }

  @action
  closeConfirmActionModal() {
    this.showConfirmActionModal = false;
  }
}
