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
  icon
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';
import { nodeCanShowTooltip } from 'screwdriver-ui/utils/pipeline/graph/tooltip';

export default class PipelineWorkflowGraphComponent extends Component {
  decoratedGraph;

  constructor() {
    super(...arguments);

    this.getDecoratedGraph();
  }

  getDecoratedGraph() {
    this.decoratedGraph = decorateGraph({
      inputGraph: this.args.workflowGraph,
      builds: this.args.builds,
      jobs: this.args.jobs.map(job => {
        return { ...job, isDisabled: job.state === 'DISABLED' };
      }),
      start: this.args.event.startFrom,
      chainPR: this.args.chainPr,
      prNum: this.args.event.prNum,
      stages: this.args.stages
    });
  }

  @action
  draw(element) {
    const isSkippedEvent = isSkipped(this.args.event, this.args.builds);
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
    const svg = getGraphSvg(
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
            svg,
            this.decoratedGraph,
            elementSizes,
            nodeWidth,
            onClickStageMenu,
            this.args.displayStageTooltip
          )
        : {};

    // edges
    addEdges(
      svg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      isSkippedEvent,
      verticalDisplacements
    );

    // Jobs Icons
    addJobIcons(
      svg,
      this.decoratedGraph,
      elementSizes,
      nodeWidth,
      verticalDisplacements,
      isSkippedEvent,
      onClickNode
    );

    addJobNames(
      svg,
      this.decoratedGraph,
      elementSizes,
      maximumJobNameLength,
      verticalDisplacements
    );
  }

  @action
  redraw(element) {
    if (
      this.decoratedGraph.nodes.length !== this.args.workflowGraph.nodes.length
    ) {
      this.getDecoratedGraph();
      element.replaceChildren();
      this.draw(element);

      return;
    }

    this.getDecoratedGraph();
    this.decoratedGraph.nodes.forEach(node => {
      const n = element.querySelector(`g.graph-node[data-job="${node.name}"]`);

      if (n) {
        const txt = n.querySelector('text');

        txt.firstChild.textContent = icon(node.status);
        n.setAttribute(
          'class',
          `graph-node${
            node.status ? ` build-${node.status.toLowerCase()}` : ''
          }`
        );
      }
    });
  }
}
