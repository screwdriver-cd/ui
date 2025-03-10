import { isActivePipeline } from 'screwdriver-ui/utils/pipeline';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed, set, setProperties } from '@ember/object';
import { reject } from 'rsvp';
import { isRoot } from 'screwdriver-ui/utils/graph-tools';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import {
  canJobStart,
  canStageStart
} from 'screwdriver-ui/utils/pipeline-workflow';
import { isPipelineParameter } from 'screwdriver-ui/utils/pipeline/parameters';
import { copy } from 'ember-copy';

export default Component.extend({
  session: service(),
  // get all downstream triggers for a pipeline
  classNames: ['pipelineWorkflow'],
  showTooltip: false,
  graph: computed(
    'workflowGraph',
    'completeWorkflowGraph',
    'showDownstreamTriggers',
    'selectedEventObj.status',
    {
      get() {
        const { jobs } = this;
        const graph = this.showDownstreamTriggers
          ? this.completeWorkflowGraph
          : this.workflowGraph;
        // Hack to make page display stuff when a workflow is not provided

        if (!graph) {
          return reject(new Error('No workflow graph provided'));
        }

        // Preload the builds for the jobs
        jobs.forEach(j => {
          const jobName = j.name;
          const node = graph.nodes.find(n => n.name === jobName);

          // push the job id into the graph
          if (node) {
            node.id = j.id;
          }
        });

        set(this, 'directedGraph', graph);

        return graph;
      }
    }
  ),

  canRestartPipeline: computed('authenticated', 'pipeline.state', {
    get() {
      return this.authenticated && isActivePipeline(this.get('pipeline'));
    }
  }),

  init() {
    this._super(...arguments);

    setProperties(this, {
      builds: [],
      showDownstreamTriggers: false,
      reason: ''
    });
    this.setStageBuilds();
  },

  setStageBuilds() {
    let stageBuilds = [];

    if (this.get('selectedEventObj.hasStages')) {
      stageBuilds = this.get('selectedEventObj.stageBuilds');
    }

    setProperties(this, {
      stageBuilds
    });
  },

  canJobStartFromView: computed(
    'selectedEventObj.workflowGraph',
    'tooltipData',
    'activeTab',
    function canJobStartFromView() {
      const { tooltipData } = this;

      if (tooltipData && tooltipData.job) {
        return canJobStart(
          this.activeTab,
          this.selectedEventObj.workflowGraph,
          tooltipData.job.name
        );
      }

      // job is not selected or upstream/downstream node are selected
      return false;
    }
  ),

  displayStageMenuHandle: computed(
    'selectedEventObj.type',
    'session.isAuthenticated',
    function displayStageMenuHandle() {
      return (
        this.session.isAuthenticated &&
        this.get('selectedEventObj.type') !== 'pr'
      );
    }
  ),

  canStageStartFromView: computed(
    'selectedEventObj.workflowGraph',
    'stageMenuData',
    'activeTab',
    function canStageStartFromView() {
      const { stageMenuData } = this;

      if (stageMenuData && stageMenuData.stage) {
        return canStageStart(
          this.activeTab,
          this.selectedEventObj.workflowGraph,
          stageMenuData.stage
        );
      }

      // stage is not selected
      return false;
    }
  ),

  getDefaultPipelineParameters() {
    return this.get('pipeline.parameters') === undefined
      ? {}
      : this.get('pipeline.parameters');
  },

  getDefaultJobParameters() {
    return this.get('pipeline.jobParameters') === undefined
      ? {}
      : this.get('pipeline.jobParameters');
  },

  mergeDefaultAndEventParameters(defaultParameters = {}, eventParameters) {
    const defaultParameterNames = Object.keys(defaultParameters);
    const mergedParameters = copy(defaultParameters, true);

    if (eventParameters) {
      Object.entries(eventParameters).forEach(
        ([eventParameterName, eventParameterDefinition]) => {
          if (defaultParameterNames.includes(eventParameterName)) {
            const defaultParameterValue =
              mergedParameters[eventParameterName].value ||
              mergedParameters[eventParameterName];

            const eventParameterValue =
              eventParameterDefinition.value || eventParameterDefinition;

            if (Array.isArray(defaultParameterValue)) {
              defaultParameterValue.removeObject(eventParameterValue);
              defaultParameterValue.unshift(eventParameterValue);
            } else if (mergedParameters[eventParameterName].value) {
              mergedParameters[eventParameterName].value = eventParameterValue;
            } else {
              mergedParameters[eventParameterName] = eventParameterValue;
            }
          } else if (typeof eventParameters[eventParameterName] === 'object') {
            mergedParameters[eventParameterName] = copy(
              eventParameterDefinition,
              true
            );
          } else {
            mergedParameters[eventParameterName] = eventParameterDefinition;
          }
        }
      );
    }

    return mergedParameters;
  },

  buildPipelineParameters: computed(
    'tooltipData.pipelineParameters',
    function preselectBuildParameters() {
      return this.mergeDefaultAndEventParameters(
        this.getDefaultPipelineParameters(),
        this.get('tooltipData.pipelineParameters')
      );
    }
  ),

  buildJobParameters: computed(
    'tooltipData.jobParameters',
    function preselectBuildParameters() {
      const defaultParameters = this.getDefaultJobParameters();
      const buildParameters = copy(defaultParameters, true);

      if (this.tooltipData) {
        const currentEventParameters = this.tooltipData.jobParameters;

        Object.entries(currentEventParameters).forEach(
          ([jobName, currentJobParameters]) => {
            const buildJobParameters =
              get(buildParameters, jobName) === undefined
                ? {}
                : get(buildParameters, jobName);

            buildParameters[jobName] = this.mergeDefaultAndEventParameters(
              buildJobParameters,
              currentJobParameters
            );
          }
        );
      }

      return buildParameters;
    }
  ),

  didReceiveAttrs() {
    this._super(...arguments);
    this.setStageBuilds();
  },

  didUpdateAttrs() {
    this._super(...arguments);
    // hide graph tooltip when event changes
    set(this, 'showTooltip', false);
    this.setStageBuilds();
  },
  actions: {
    graphClicked(job, mouseevent, sizes) {
      setProperties(this, {
        showTooltip: false,
        showStageActionsMenu: false
      });
      this.set('showTooltip', false);
      const EXTERNAL_TRIGGER_REGEX = /^~?sd@(\d+):([\w-]+)$/;
      const edges = get(this, 'directedGraph.edges');
      const isTrigger = job ? /(^~)|(^~?sd@)/.test(job.name) : false;

      let isRootNode = true;

      let toolTipProperties = {};

      // Find root nodes to determine position of tooltip
      if (job && edges && !/^~/.test(job.name)) {
        const selectedEvent = this.selectedEventObj;
        const eventParameters =
          get(selectedEvent, 'meta.parameters') === undefined
            ? {}
            : get(selectedEvent, 'meta.parameters');
        const pipelineParameters = {};
        const jobParameters = {};
        const isPR = this.get('selectedEventObj.prNum');
        const builds = this.get('selectedEventObj.builds') || [];
        const build = builds.find(b => `${b.jobId}` === `${job.id}`);

        if (build) {
          job.buildId = build.id;
          job.status = build.status;
        }

        // Segregate pipeline level and job level parameters
        Object.entries(eventParameters).forEach(
          ([propertyName, propertyVal]) => {
            if (isPipelineParameter(propertyVal)) {
              pipelineParameters[propertyName] = propertyVal;
            } else {
              jobParameters[propertyName] = propertyVal;
            }
          }
        );

        if (isPR) {
          const originalJob = this.get('pipeline.jobs').find(
            j => j.name === job.name
          );

          if (originalJob) {
            job.isDisabled = originalJob.isDisabled;
          } else {
            delete job.isDisabled;
          }
        }

        toolTipProperties = {
          showTooltip: true,
          // detached jobs should show tooltip on the left
          showTooltipPosition: isRootNode ? 'left' : 'center',
          tooltipData: {
            displayStop: isActiveBuild(job.status),
            job,
            mouseevent,
            sizes,
            selectedEvent,
            pipelineParameters,
            jobParameters
          }
        };
        isRootNode = isRoot(edges, job.name);
      }

      if (!job || isTrigger) {
        const externalTriggerMatch = job
          ? job.name.match(EXTERNAL_TRIGGER_REGEX)
          : null;
        const downstreamTriggerMatch = job
          ? job.name.match(/^~sd-([\w-]+)-triggers$/)
          : null;

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
    onShowStageActionsMenu(stage, mouseevent) {
      const selectedEvent = this.selectedEventObj;
      const eventParameters =
        get(selectedEvent, 'meta.parameters') === undefined
          ? {}
          : get(selectedEvent, 'meta.parameters');
      const pipelineParameters = {};
      const jobParameters = {};

      // Segregate pipeline level and job level parameters
      Object.entries(eventParameters).forEach(([propertyName, propertyVal]) => {
        if (isPipelineParameter(propertyVal)) {
          pipelineParameters[propertyName] = propertyVal;
        } else {
          jobParameters[propertyName] = propertyVal;
        }
      });

      const properties = {
        showStageActionsMenu: true,
        // detached jobs should show tooltip on the left
        // showTooltipPosition: isRootNode ? 'left' : 'center',
        stageMenuData: {
          stage,
          mouseevent,
          // sizes,
          selectedEvent,
          pipelineParameters,
          jobParameters
        }
      };

      setProperties(this, properties);
    },
    confirmStartBuild(newEventStartFromType) {
      setProperties(this, {
        newEventStartFromType,
        isShowingModal: true,
        showTooltip: false,
        showStageActionsMenu: false
      });
    },
    cancelStartBuild() {
      set(this, 'isShowingModal', false);
    },
    startDetachedBuild(options) {
      let job;

      let stage = null;

      if (this.newEventStartFromType === 'STAGE') {
        stage = get(this, 'stageMenuData.stage');
        job = stage.setup;
      } else {
        job = get(this, 'tooltipData.job');
      }

      setProperties(this, {
        isShowingModal: false,
        newEventStartFromType: null
      });

      this.startDetachedBuild(job, options, stage).then(() => {
        this.set('reason', '');
      });
    }
  }
});
