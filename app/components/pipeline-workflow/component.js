import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { get, computed, set, setProperties } from '@ember/object';
import { reject } from 'rsvp';
import { isRoot } from 'screwdriver-ui/utils/graph-tools';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { copy } from 'ember-copy';

export default Component.extend({
  // get all downstream triggers for a pipeline
  classNames: ['pipelineWorkflow'],
  showTooltip: false,
  graph: computed('workflowGraph', 'completeWorkflowGraph', 'showDownstreamTriggers', {
    get() {
      const { jobs } = this;
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

      set(this, 'directedGraph', graph);

      return graph;
    }
  }),

  displayRestartButton: alias('authenticated'),

  init() {
    this._super(...arguments);

    setProperties(this, {
      builds: [],
      showDownstreamTriggers: false,
      reason: ''
    });
  },

  isPrChainJob: computed('tooltipData', function isPrChainJob() {
    const selectedEvent = get(this, 'selectedEventObj');
    const { prNum } = selectedEvent;
    const isPrChain = get(this, 'pipeline.prChain');

    return prNum !== undefined && isPrChain;
  }),

  prBuildExists: computed('tooltipData', function isStartablePrChainJob() {
    const selectedEvent = get(this, 'selectedEventObj');

    const tooltipData = get(this, 'tooltipData');

    let selectedJobId;

    if (tooltipData && tooltipData.job) {
      selectedJobId = tooltipData.job.id ? tooltipData.job.id.toString() : null;
    } else {
      // job is not selected or upstream/downstream node are selected
      return false;
    }

    const buildExists = selectedEvent.buildsSorted.filter(b => b.jobId === selectedJobId);

    const { prNum } = selectedEvent;

    return prNum && buildExists.length !== 0;
  }),

  buildParameters: computed('tooltipData', function preselectBuildParameters() {
    const defaultParameters = this.getWithDefault('pipeline.parameters', {});
    const buildParameters = copy(defaultParameters, true);

    if (this.tooltipData) {
      const currentEventParameters = this.tooltipData.selectedEvent.meta.parameters;
      const parameterNames = Object.keys(buildParameters);

      parameterNames.forEach(parameterName => {
        const parameterValue =
          buildParameters[parameterName].value || buildParameters[parameterName];
        const currentEventParameterValue =
          currentEventParameters[parameterName].value || currentEventParameters[parameterName];

        if (Array.isArray(parameterValue)) {
          parameterValue.removeObject(currentEventParameterValue);
          parameterValue.unshift(currentEventParameterValue);
        } else if (buildParameters[parameterName].value) {
          buildParameters[parameterName].value = currentEventParameterValue;
        } else {
          buildParameters[parameterName] = currentEventParameterValue;
        }
      });
    }

    return buildParameters;
  }),

  didUpdateAttrs() {
    this._super(...arguments);
    // hide graph tooltip when event changes
    set(this, 'showTooltip', false);
  },
  actions: {
    graphClicked(job, mouseevent, sizes) {
      const EXTERNAL_TRIGGER_REGEX = /^~?sd@(\d+):([\w-]+)$/;
      const edges = get(this, 'directedGraph.edges');
      const isTrigger = job ? /(^~)|(^~?sd@)/.test(job.name) : false;

      let isRootNode = true;

      let toolTipProperties = {};

      // Find root nodes to determine position of tooltip
      if (job && edges && !/^~/.test(job.name)) {
        const selectedEvent = get(this, 'selectedEventObj');

        toolTipProperties = {
          showTooltip: true,
          // detached jobs should show tooltip on the left
          showTooltipPosition: isRootNode ? 'left' : 'center',
          tooltipData: {
            displayStop: isActiveBuild(job.status),
            job,
            mouseevent,
            sizes,
            selectedEvent
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
            const downstreamTrigger = t.match(/^~?sd@(\d+):([\w-]+)$/);

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
      setProperties(this, {
        isShowingModal: true,
        showTooltip: false
      });
    },
    cancelStartBuild() {
      set(this, 'isShowingModal', false);
    },
    startDetachedBuild(options) {
      set(this, 'isShowingModal', false);
      this.startDetachedBuild(get(this, 'tooltipData.job'), options).then(() => {
        this.set('reason', '');
      });
    }
  }
});
