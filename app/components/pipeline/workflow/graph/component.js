/* global d3 */
import Component from '@glimmer/component';
import { action } from '@ember/object';
import { isSkipped } from 'screwdriver-ui/utils/pipeline/event';
import { decorateGraph } from 'screwdriver-ui/utils/graph-tools';
import {
  addEdges,
  addJobIcons,
  addJobNames,
  addStages,
  getElementSizes,
  getGraphSvg,
  getMaximumJobNameLength,
  getNodeWidth,
  updateEdgeStatuses,
  updateJobStatuses
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';
import { nodeCanShowTooltip } from 'screwdriver-ui/utils/pipeline/graph/tooltip';

export default class PipelineWorkflowGraphComponent extends Component {
  event;

  builds;

  decoratedGraph;

  graphSvg;

  constructor() {
    super(...arguments);
    this.event = this.args.event;
    this.builds = this.args.builds;

    this.getDecoratedGraph(
      this.args.workflowGraph,
      this.args.builds,
      this.args.event
    );
  }

  getDecoratedGraph(workflowGraph, builds, event) {
    this.decoratedGraph = decorateGraph({
      inputGraph: workflowGraph,
      builds,
      jobs: this.args.jobs.map(job => {
        return { ...job, isDisabled: job.state === 'DISABLED' };
      }),
      start: event.startFrom,
      chainPR: this.args.chainPr,
      prNum: event.prNum,
      stages: this.args.stages
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

    // Add the SVG element
    this.graphSvg = getGraphSvg(
      element,
      this.decoratedGraph,
      elementSizes,
      maximumJobNameLength,
      onClickGraph
    );

    // stages
    const verticalDisplacements =
      this.args.stages.length > 0
        ? addStages(
            this.graphSvg,
            this.decoratedGraph,
            elementSizes,
            nodeWidth,
            onClickStageMenu,
            this.args.displayStageTooltip
          )
        : {};

    // edges
    addEdges(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      isSkippedEvent,
      verticalDisplacements
    );

    // Jobs Icons
    addJobIcons(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      verticalDisplacements,
      isSkippedEvent,
      onClickNode
    );

    addJobNames(
      this.graphSvg,
      this.decoratedGraph,
      elementSizes,
      maximumJobNameLength,
      verticalDisplacements
    );
  }

  @action
  redraw(element, [workflowGraph, builds, event]) {
    if (
      this.event.id !== event.id ||
      this.decoratedGraph.nodes.length !== workflowGraph.nodes.length
    ) {
      if (this.event.id !== event.id) {
        this.event = event;
      }
      this.builds = builds;

      this.getDecoratedGraph(workflowGraph, builds, event);
      element.replaceChildren();
      this.draw(element);

      return;
    }

    this.getDecoratedGraph(workflowGraph, builds, event);
    updateEdgeStatuses(this.graphSvg, this.decoratedGraph);
    updateJobStatuses(this.graphSvg, this.decoratedGraph);
  }
}
