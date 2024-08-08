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
  getNodeWidth
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';
import { nodeCanShowTooltip } from 'screwdriver-ui/utils/pipeline/graph/tooltip';

export default class PipelineWorkflowGraphComponent extends Component {
  @action
  draw(element) {
    const data = decorateGraph({
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

    const isSkippedEvent = isSkipped(this.args.event, this.args.builds);
    const elementSizes = getElementSizes();
    const maximumJobNameLength = getMaximumJobNameLength(
      data,
      this.args.displayJobNameLength
    );
    const nodeWidth = getNodeWidth(elementSizes, maximumJobNameLength);

    const onClickGraph = () => {
      this.args.setShowTooltip(false);
    };

    const onClickNode = node => {
      if (nodeCanShowTooltip(node)) {
        this.args.setShowTooltip(true, node, d3.event);
      }
    };

    // Add the SVG element
    const svg = getGraphSvg(
      element,
      data,
      elementSizes,
      maximumJobNameLength,
      onClickGraph
    );

    // stages
    const verticalDisplacements =
      this.args.stages.length > 0
        ? addStages(svg, data, elementSizes, nodeWidth)
        : {};

    // edges
    addEdges(
      svg,
      data,
      elementSizes,
      nodeWidth,
      isSkippedEvent,
      verticalDisplacements
    );

    // Jobs Icons
    addJobIcons(
      svg,
      data,
      elementSizes,
      nodeWidth,
      verticalDisplacements,
      isSkippedEvent,
      onClickNode
    );

    addJobNames(
      svg,
      data,
      elementSizes,
      maximumJobNameLength,
      verticalDisplacements
    );
  }
}
