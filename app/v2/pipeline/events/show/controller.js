import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import ENV from 'screwdriver-ui/config/environment';
import { getFilteredGraph } from 'screwdriver-ui/components/pipeline/workflow/util';

export default class V2PipelineEventsShowController extends Controller {
  @service session;

  @tracked showStartEventModal = false;

  @tracked showDownstreamTriggers = false;

  @tracked showTooltip = false;

  @tracked showStageTooltip = false;

  @tracked d3Data = null;

  get workflowGraph() {
    return getFilteredGraph(this.model.event.workflowGraph);
  }

  get workflowGraphWithDownstreamTriggers() {
    const workflowGraph = structuredClone(
      getFilteredGraph(this.model.event.workflowGraph)
    );
    const { triggers } = this.model;

    triggers.forEach(trigger => {
      if (trigger.triggers.length > 0) {
        workflowGraph.nodes.push({
          name: `~sd-${trigger.jobName}-triggers`,
          triggers: trigger.triggers,
          status: 'DOWNSTREAM_TRIGGER'
        });
        workflowGraph.edges.push({
          src: trigger.jobName,
          dest: `~sd-${trigger.jobName}-triggers`
        });
      }
    });

    return workflowGraph;
  }

  get displayJobNameLength() {
    return this.model.userSettings.displayJobNameLength
      ? this.model.userSettings.displayJobNameLength
      : ENV.APP.MINIMUM_JOBNAME_LENGTH;
  }

  @action
  openStartEventModal() {
    this.showStartEventModal = true;
  }

  @action
  closeStartEventModal() {
    this.showStartEventModal = false;
  }

  @action
  toggleShowDownstreamTriggers() {
    this.showDownstreamTriggers = !this.showDownstreamTriggers;
  }

  @action
  setShowTooltip(showTooltip, node, d3Event) {
    this.showTooltip = showTooltip;

    if (showTooltip) {
      this.d3Data = { node, d3Event };
    } else {
      this.d3Data = null;
    }
  }

  @action
  setShowStageTooltip(showStageTooltip, stage, d3Event) {
    this.showStageTooltip = showStageTooltip;

    if (showStageTooltip) {
      this.d3Data = { stage, d3Event };
    } else {
      this.d3Data = null;
    }
  }
}
