/* global d3 */
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isSkipped } from 'screwdriver-ui/utils/pipeline/event';
import { decorateGraph } from 'screwdriver-ui/utils/graph-tools';
import {
  addEdges,
  addJobIcons,
  addJobNames,
  addStages,
  addStageEdges,
  getElementSizes,
  getGraphSvg,
  getMaximumJobNameLength,
  getNodeWidth,
  updateEdgeStatuses,
  updateJobStatuses,
  updateStageStatuses,
  updateStageEdgeStatuses
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';
import { nodeCanShowTooltip } from 'screwdriver-ui/utils/pipeline/graph/tooltip';

export default class PipelineWorkflowGraphComponent extends Component {
  @service pipelinePageState;

  event;

  builds;

  stageBuilds;

  decoratedGraph;

  collapsedStages;

  graphSvg;

  constructor() {
    super(...arguments);
    this.event = this.args.event;
    this.builds = this.args.builds;
    this.stageBuilds = this.args.stageBuilds;
    this.collapsedStages = this.args.collapsedStages;

    this.getDecoratedGraph(
      this.args.workflowGraph,
      this.args.builds,
      this.args.stageBuilds,
      this.args.event,
      this.args.collapsedStages
    );
  }

  getDecoratedGraph(
    workflowGraph,
    builds,
    stageBuilds,
    event,
    collapsedStages
  ) {
    this.decoratedGraph = decorateGraph({
      inputGraph: workflowGraph,
      builds,
      stageBuilds,
      jobs: this.pipelinePageState.getJobs().map(job => {
        return { ...job, isDisabled: job.state === 'DISABLED' };
      }),
      start: event.startFrom,
      chainPR: this.args.chainPr,
      prNum: event.prNum,
      stages: this.pipelinePageState.getStages(),
      collapsedStages
    });
  }

  @action
  draw(element) {
    const isSkippedEvent = isSkipped(this.event, this.builds);
    const elementSizes = getElementSizes();
    const maximumJobNameLength = getMaximumJobNameLength(
      this.decoratedGraph,
      this.args.displayJobNameLength
    );
    const nodeWidth = getNodeWidth(elementSizes, maximumJobNameLength);

    const onClickGraph = () => {
      this.args.setShowTooltip(false);
      this.args.setShowStageTooltip(false);
    };

    const onClickNode = node => {
      if (nodeCanShowTooltip(node)) {
        this.args.setShowTooltip(true, node, d3.event);
      }
    };

    const onClickStageMenu = stage => {
      this.args.setShowStageTooltip(true, stage, d3.event);
    };

    const onClickStageViewToggle = (stageName, isCollapsed) => {
      this.args.toggleStageView(stageName, isCollapsed);
    };

    // Add the SVG element
    this.graphSvg = getGraphSvg(
      element,
      this.decoratedGraph,
      elementSizes,
      maximumJobNameLength,
      onClickGraph
    );

    const hasStages = this.pipelinePageState.getStages().length > 0;

    // stages
    const { verticalDisplacements, horizontalDisplacements } = hasStages
      ? addStages(
          this.graphSvg,
          this.decoratedGraph,
          elementSizes,
          nodeWidth,
          onClickStageMenu,
          this.args.displayStageTooltip,
          onClickStageViewToggle
        )
      : {};

    // stage edges
    if (hasStages) {
      addStageEdges(
        this.graphSvg,
        this.decoratedGraph,
        elementSizes,
        nodeWidth,
        isSkippedEvent,
        verticalDisplacements,
        horizontalDisplacements
      );
    }

    // edges
    addEdges(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      isSkippedEvent,
      verticalDisplacements,
      horizontalDisplacements
    );

    // Jobs Icons
    addJobIcons(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      verticalDisplacements,
      horizontalDisplacements,
      isSkippedEvent,
      onClickNode
    );

    addJobNames(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      maximumJobNameLength,
      verticalDisplacements,
      horizontalDisplacements
    );
  }

  @action
  redraw(
    element,
    [workflowGraph, builds, stageBuilds, event, collapsedStages]
  ) {
    const elementSizes = getElementSizes();
    const maximumJobNameLength = getMaximumJobNameLength(
      this.decoratedGraph,
      this.args.displayJobNameLength
    );
    const nodeWidth = getNodeWidth(elementSizes, maximumJobNameLength);

    if (
      this.event.id !== event.id ||
      this.decoratedGraph.nodes.length !== workflowGraph.nodes.length ||
      this.collapsedStages.size !== collapsedStages.size
    ) {
      if (this.event.id !== event.id) {
        this.event = event;
      }
      this.builds = builds;
      this.stageBuilds = stageBuilds;
      this.collapsedStages = collapsedStages;

      this.getDecoratedGraph(
        workflowGraph,
        builds,
        stageBuilds,
        event,
        collapsedStages
      );
      element.replaceChildren();
      this.draw(element);

      return;
    }

    this.getDecoratedGraph(
      workflowGraph,
      builds,
      stageBuilds,
      event,
      collapsedStages
    );
    updateEdgeStatuses(this.graphSvg, this.decoratedGraph);
    updateStageEdgeStatuses(this.graphSvg, this.decoratedGraph);
    updateJobStatuses(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth
    );
    updateStageStatuses(this.graphSvg, this.decoratedGraph);
  }
}
