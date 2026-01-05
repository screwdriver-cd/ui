import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { canJobStart } from 'screwdriver-ui/utils/pipeline-workflow';

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
      this.args.d3Data.stage.setup.name
    );
  }

  get job() {
    const setupJob = this.args.d3Data.stage.setup;

    return {
      ...setupJob,
      status: this.args.d3Data.stage.status
    };
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
