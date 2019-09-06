import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { get, computed, set, setProperties } from '@ember/object';
import { all, reject } from 'rsvp';
import { isRoot } from 'screwdriver-ui/utils/graph-tools';
import { isActiveBuild } from 'screwdriver-ui/utils/build';

export default Component.extend({
  // get all downstream triggers for a pipeline
  classNames: ['pipelineWorkflow'],
  showTooltip: false,
  graph: computed('workflowGraph', 'completeWorkflowGraph', 'showDownstreamTriggers', {
    get() {
      const { jobs } = this;
      const fetchBuilds = [];
      const graph = this.showDownstreamTriggers ? this.completeWorkflowGraph : this.workflowGraph;

      // Hack to make page display stuff when a workflow is not provided
      if (!graph) {
        return reject(new Error('No workflow graph provided'));
      }

      // Preload the builds for the jobs
      jobs.forEach(j => {
        const jobName = get(j, 'name');
        const node = graph.nodes.find(n => n.name === jobName);

        // push the job id into the graph
        if (node) {
          node.id = get(j, 'id');
        }
      });

      return all(fetchBuilds).then(() => {
        const builds = [];

        // set values to consume from templates
        set(this, 'builds', builds);
        set(this, 'directedGraph', graph);

        return graph;
      });
    }
  }),
  displayRestartButton: alias('authenticated'),

  init() {
    this._super(...arguments);
    set(this, 'builds', []);
    set(this, 'showDownstreamTriggers', false);
  },
  didUpdateAttrs() {
    this._super(...arguments);
    // hide graph tooltip when event changes
    set(this, 'showTooltip', false);
  },
  actions: {
    graphClicked(job, mouseevent, sizes) {
      const EXTERNAL_TRIGGER_REGEX = /^~sd@(\d+):([\w-]+)$/;
      const edges = get(this, 'directedGraph.edges');
      let isRootNode = true;
      const isTrigger = job ? /^~/.test(job.name) : false;
      let toolTipProperties = {};

      // Find root nodes to determine position of tooltip
      if (job && edges && !/^~/.test(job.name)) {
        toolTipProperties = {
          showTooltip: true,
          // detached jobs should show tooltip on the left
          showTooltipPosition: isRootNode ? 'left' : 'center',
          tooltipData: {
            displayStop: isActiveBuild(job.status),
            job,
            mouseevent,
            sizes
          }
        };
        isRootNode = isRoot(edges, job.name);
      }

      if (!job || isTrigger) {
        const externalTriggerMatch = job ? job.name.match(EXTERNAL_TRIGGER_REGEX) : null;
        const downstreamTriggerMatch = job ? job.name.match(/^~sd-([\w-]+)-triggers$/) : null;

        // Add external trigger data if relevant
        if (externalTriggerMatch) {
          const externalTrigger = {
            pipelineId: externalTriggerMatch[1],
            jobName: externalTriggerMatch[2]
          };

          toolTipProperties = {
            showTooltip: true,
            showTooltipPosition: 'left',
            tooltipData: {
              mouseevent,
              sizes,
              externalTrigger
            }
          };

          setProperties(this, toolTipProperties);

          return false;
        }

        // Add downstream trigger data if relevant
        if (downstreamTriggerMatch) {
          const triggers = [];

          job.triggers.forEach(t => {
            const downstreamTrigger = t.match(/^~sd@(\d+):([\w-]+)$/);

            triggers.push({
              triggerName: t,
              pipelineId: downstreamTrigger[1],
              jobName: downstreamTrigger[2]
            });
          });

          toolTipProperties = {
            showTooltip: true,
            showTooltipPosition: 'left',
            tooltipData: {
              mouseevent,
              sizes,
              triggers
            }
          };

          setProperties(this, toolTipProperties);

          return false;
        }
        // Hide tooltip when not clicking on an active job node or root node
        this.set('showTooltip', false);

        return false;
      }

      setProperties(this, toolTipProperties);

      return false;
    },
    confirmStartBuild() {
      set(this, 'isShowingModal', true);
      set(this, 'showTooltip', false);
    },
    cancelStartBuild() {
      set(this, 'isShowingModal', false);
    },
    startDetachedBuild() {
      set(this, 'isShowingModal', false);
      this.startDetachedBuild(get(this, 'tooltipData.job'));
    }
  }
});
