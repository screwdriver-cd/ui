/* global d3 */
import { set, computed } from '@ember/object';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import {
  decorateGraph,
  subgraphFilter,
  removeBranch
} from 'screwdriver-ui/utils/graph-tools';
import {
  addEdges,
  addJobIcons,
  addJobNames,
  addStages,
  addStageEdges,
  calcNodeCenter,
  getElementSizes,
  getGraphSvg,
  getMaximumJobNameLength,
  getNodeWidth,
  icon,
  STATUS_MAP
} from 'screwdriver-ui/utils/pipeline/graph/d3-graph-util';

export default Component.extend({
  shuttle: service(),
  store: service(),
  router: service(),
  userSettings: service(),
  classNameBindings: ['minified'],
  showPRJobs: true,
  graph: { nodes: [], edges: [] },
  showStages: computed('minified', 'stages', {
    get() {
      const stages = this.stages === undefined ? [] : this.stages;

      return !(this.minified || stages.length === 0);
    }
  }),
  decoratedGraph: computed(
    'builds.@each.{id,status}',
    'stageBuilds.@each.{id,status}',
    'completeWorkflowGraph',
    'jobs.@each.{isDisabled,state,stateChanger}',
    'minified',
    'prJobs',
    'selectedEventObj.status',
    'selectedEventObj.prNum',
    'showDownstreamTriggers',
    'showPRJobs',
    'startFrom',
    'workflowGraph',
    'prChainEnabled',
    'stages',
    {
      get() {
        let { showPRJobs } = this;
        const showDownstreamTriggers =
          this.showDownstreamTriggers === undefined
            ? false
            : this.showDownstreamTriggers;
        const builds = this.builds === undefined ? [] : this.builds;
        const stageBuilds =
          this.stageBuilds === undefined ? [] : this.stageBuilds;

        const { startFrom } = this;

        const stages = this.stages === undefined ? [] : this.stages;
        const prJobs = this.prJobs === undefined ? [] : this.prJobs;
        const jobs = (this.jobs === undefined ? [] : this.jobs).concat(prJobs);

        const workflowGraph =
          this.workflowGraph === undefined
            ? {
                nodes: [],
                edges: []
              }
            : this.workflowGraph;
        const completeGraph =
          this.completeWorkflowGraph === undefined
            ? {
                nodes: [],
                edges: []
              }
            : this.completeWorkflowGraph;

        const graph = showDownstreamTriggers ? completeGraph : workflowGraph;

        if (!this.minified && this.selectedEventObj?.prNum) {
          showPRJobs = true;
        }

        // set warning status if has warning
        if (builds.length) {
          builds.forEach(build => {
            if (build?.meta?.build?.warning && build.status === 'SUCCESS') {
              build.status = 'WARNING';
            }
          });
        }

        // only remove node if it is not a source node
        const endNodes = graph.nodes.filter(node => {
          if (node.name.startsWith('sd@')) {
            // check if an edge has this node as source
            if (
              graph.edges.filter(edge => edge.src === node.name).length <= 0
            ) {
              return true;
            }
          }

          return false;
        });

        // remove duplicate dangling trigger jobs from graph
        if (endNodes.length) {
          graph.nodes.removeObjects(endNodes);
          endNodes.forEach(endNode => {
            const endEdges = graph.edges.filter(
              edge => edge.dest === endNode.name
            );

            graph.edges.removeObjects(endEdges);
          });
        }

        // remove jobs that starts from ~pr
        if (!showPRJobs) {
          const prNode = graph.nodes.findBy('name', '~pr');

          removeBranch(prNode, graph);
        }
        set(this, 'graph', graph);

        return decorateGraph({
          inputGraph: this.minified ? subgraphFilter(graph, startFrom) : graph,
          builds,
          stageBuilds,
          jobs,
          start: startFrom,
          chainPR: this.prChainEnabled,
          prNum: this.selectedEventObj?.prNum,
          stages: this.minified ? [] : stages
        });
      }
    }
  ),
  elementSizes: computed('minified', {
    get() {
      return getElementSizes(this.minified);
    }
  }),

  didInsertElement() {
    this._super(...arguments);

    this.draw(this.decoratedGraph);

    set(this, 'lastGraph', this.graph);
  },

  // Listen for changes to workflow and update graph accordingly.
  didUpdateAttrs() {
    this._super(...arguments);
    const dg = this.decoratedGraph;

    this.doRedraw(dg);
  },
  doRedraw(decoratedGraph) {
    const lg = this.lastGraph;
    const wg = this.graph;

    if (!this.graphNode) {
      return;
    }

    // redraw anyways when graph changes
    if (lg !== wg) {
      this.graphNode.remove();

      this.draw(decoratedGraph);
      set(this, 'lastGraph', wg);
    } else {
      this.redraw(decoratedGraph).then(() => {});
    }
  },
  actions: {
    buildClicked(job) {
      const fn = this.graphClicked;

      if (!this.minified && typeof fn === 'function') {
        fn(job, d3.event, this.elementSizes);
      }
    },

    stageMenuHandleClicked(stage) {
      const fn = this.onShowStageActionsMenu;

      if (!this.minified && typeof fn === 'function') {
        fn(stage, d3.event);
      }
    }
  },
  async redraw(data) {
    if (!data) return;
    const el = d3.select(this.element);

    const elementSizes = getElementSizes();
    const { ICON_SIZE } = elementSizes;
    const desiredJobNameLength =
      await this.userSettings.getDisplayJobNameLength();
    const maximumJobNameLength = getMaximumJobNameLength(
      this.decoratedGraph,
      desiredJobNameLength
    );
    const nodeWidth = getNodeWidth(elementSizes, maximumJobNameLength);

    // redraw nodes
    data.nodes.forEach(node => {
      const n = el.select(`g.graph-node[data-job="${node.name}"]`);

      if (n) {
        const txt = n.select('text');

        txt.text(icon(node.status, node.virtual));
        n.attr(
          'class',
          `graph-node${
            node.status ? ` build-${node.status.toLowerCase()}` : ''
          }`
        )
          .attr(
            'font-size',
            `${
              icon(node.status, node.virtual) === STATUS_MAP.VIRTUAL.icon
                ? ICON_SIZE * 2
                : ICON_SIZE
            }px`
          )
          .style('text-anchor', 'middle')
          .attr(
            'x',
            calcNodeCenter(node.pos.x, nodeWidth) +
              (icon(node.status, node.virtual) === STATUS_MAP.VIRTUAL.icon
                ? ICON_SIZE / 2
                : 0)
          );
      }
    });

    // redraw stages
    data.stages.forEach(stage => {
      const s = el.select(`g.stage-container[data-stage="${stage.name}"]`);

      if (s) {
        s.attr(
          'class',
          stage.status
            ? `stage-container build-${stage.status.toLowerCase()}`
            : 'stage-container'
        );
      }
    });
  },
  async draw(data) {
    if (this.isDestroying || this.isDestroyed) {
      console.log('something happened here');

      return;
    }

    const desiredJobNameLength =
      await this.userSettings.getDisplayJobNameLength();
    const maximumJobNameLength = getMaximumJobNameLength(
      data,
      desiredJobNameLength
    );
    const nodeWidth = getNodeWidth(this.elementSizes, maximumJobNameLength);
    const isSkipped = this.isSkipped === undefined ? false : this.isSkipped;

    const onClick = e => {
      this.send('buildClicked', e);
    };

    const onStageMenuHandleClick = stage => {
      this.send('stageMenuHandleClicked', stage);
    };

    // Add the SVG element
    const svg = getGraphSvg(
      this.element,
      data,
      this.elementSizes,
      maximumJobNameLength,
      onClick
    );

    this.set('graphNode', svg);

    // stages
    const { verticalDisplacements, horizontalDisplacements } = this.showStages
      ? addStages(
          svg,
          data,
          this.elementSizes,
          nodeWidth,
          onStageMenuHandleClick,
          this.displayStageMenuHandle
        )
      : {};

    // stage edges
    if (this.showStages) {
      addStageEdges(
        svg,
        data,
        this.elementSizes,
        nodeWidth,
        isSkipped,
        verticalDisplacements,
        horizontalDisplacements
      );
    }

    // edges
    addEdges(
      svg,
      data,
      this.elementSizes,
      nodeWidth,
      isSkipped,
      verticalDisplacements,
      horizontalDisplacements
    );

    // Jobs Icons
    addJobIcons(
      svg,
      data,
      this.elementSizes,
      nodeWidth,
      verticalDisplacements,
      horizontalDisplacements,
      isSkipped,
      onClick
    );

    // Job Names
    if (this.elementSizes.TITLE_SIZE) {
      addJobNames(
        svg,
        data,
        this.elementSizes,
        maximumJobNameLength,
        verticalDisplacements,
        horizontalDisplacements
      );
    }
  }
});
