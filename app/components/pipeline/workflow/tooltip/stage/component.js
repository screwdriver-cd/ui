import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { canJobStart } from 'screwdriver-ui/utils/pipeline-workflow';

export default class PipelineWorkflowTooltipStageComponent extends Component {
  @service router;

  @service session;

  @tracked showConfirmActionModal = false;

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

  get stageStatus() {
    const build = this.args.builds.find(
      b => b.jobId === this.args.d3Data.stage.setup.id
    );

    return build ? build.status : null;
  }

  get job() {
    const setupJob = this.args.d3Data.stage.setup;

    return {
      ...setupJob,
      status: this.stageStatus
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

      element.style.top = `${y - workflowGraphRect.y + 2}px`;
      // 14 is 1 rem (the padding of the tooltip)
      // 2 is the border width
      // 13 is the width of the tooltip triangle
      element.style.left = `${x - workflowGraphRect.x - 14 - 2 - 13}px`;
    }
  }

  @action
  openConfirmActionModal() {
    this.showConfirmActionModal = true;
  }

  @action
  closeConfirmActionModal() {
    this.showConfirmActionModal = false;
  }
}
