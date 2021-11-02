import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { alias } from '@ember/object/computed';
import Component from '@ember/component';
import { set, setProperties, action, computed } from '@ember/object';
import { reject } from 'rsvp';
import { isRoot } from 'screwdriver-ui/utils/graph-tools';
import { isActiveBuild } from 'screwdriver-ui/utils/build';
import { copy } from 'ember-copy';

@classic
@tagName('')
export default class PipelineWorkflow extends Component {
  showTooltip = false;

  @computed('workflowGraph', 'completeWorkflowGraph', 'showDownstreamTriggers')
  get graph() {
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

  @alias('authenticated')
  displayRestartButton;

  init() {
    super.init(...arguments);

    setProperties(this, {
      builds: [],
      showDownstreamTriggers: false,
      reason: ''
    });
  }

  @computed('pipeline.prChain', 'selectedEventObj', 'tooltipData')
  get isPrChainJob() {
    const selectedEvent =
      this.selectedEventObj === undefined ? {} : this.selectedEventObj;
    const { prNum } = selectedEvent;
    const isPrChain = this.pipeline.prChain;

    return prNum !== undefined && isPrChain;
  }

  @computed('selectedEventObj', 'tooltipData')
  get prBuildExists() {
    const selectedEvent = this.selectedEventObj;

    const { tooltipData } = this;

    let selectedJobId;

    if (tooltipData && tooltipData.job) {
      selectedJobId = tooltipData.job.id ? tooltipData.job.id.toString() : null;
    } else {
      // job is not selected or upstream/downstream node are selected
      return false;
    }

    const buildExists = selectedEvent.buildsSorted.filter(
      b => b.jobId === selectedJobId
    );

    const { prNum } = selectedEvent;

    return prNum && buildExists.length !== 0;
  }

  getDefaultPipelineParameters() {
    return this.pipeline?.parameters || {};
  }

  getDefaultJobParameters() {
    return this.pipeline?.jobParameters || {};
  }

  mergeDefaultAndEventParameters(defaultParameters = {}, eventParameters) {
    const mergedParameters = copy(defaultParameters, true);
    const parameterNames = Object.keys(eventParameters);

    if (eventParameters) {
      parameterNames.forEach(parameterName => {
        const parameterValue =
          mergedParameters[parameterName].value ||
          mergedParameters[parameterName];
        const eventParameterValue =
          eventParameters[parameterName].value ||
          eventParameters[parameterName];

        if (Array.isArray(parameterValue)) {
          parameterValue.removeObject(eventParameterValue);
          parameterValue.unshift(eventParameterValue);
        } else if (mergedParameters[parameterName].value) {
          mergedParameters[parameterName].value = eventParameterValue;
        } else {
          mergedParameters[parameterName] = eventParameterValue;
        }
      });
    }

    return mergedParameters;
  }

  @computed('tooltipData.pipelineParameters')
  get buildPipelineParameters() {
    return this.mergeDefaultAndEventParameters(
      this.getDefaultPipelineParameters(),
      this.tooltipData?.pipelineParameters
    );
  }

  @computed('tooltipData.jobParameters')
  get buildJobParameters() {
    const defaultParameters = this.getDefaultJobParameters();
    const buildParameters = copy(defaultParameters, true);

    if (this.tooltipData) {
      const currentEventParameters = this.tooltipData.jobParameters;

      Object.entries(currentEventParameters).forEach(
        ([jobName, currentJobParameters]) => {
          const buildJobParameters = buildParameters[jobName] || {};

          buildParameters[jobName] = this.mergeDefaultAndEventParameters(
            buildJobParameters,
            currentJobParameters
          );
        }
      );
    }

    return buildParameters;
  }

  didUpdateAttrs() {
    super.didUpdateAttrs(...arguments);
    // hide graph tooltip when event changes
    set(this, 'showTooltip', false);
  }

  @action
  graphClicked(job, mouseevent, sizes) {
    const EXTERNAL_TRIGGER_REGEX = /^~?sd@(\d+):([\w-]+)$/;
    const { edges } = this.directedGraph;
    const isTrigger = job ? /(^~)|(^~?sd@)/.test(job.name) : false;

    let isRootNode = true;

    let toolTipProperties = {};

    // Find root nodes to determine position of tooltip
    if (job && edges && !/^~/.test(job.name)) {
      const selectedEvent = this.selectedEventObj;
      const eventParameters = selectedEvent.meta.parameters;
      const pipelineParameters = {};
      const jobParameters = {};

      // Segregate pipeline level and job level parameters
      Object.entries(eventParameters).forEach(([propertyName, propertyVal]) => {
        const keys = Object.keys(propertyVal);

        if (keys.length === 1 && keys[0] === 'value') {
          pipelineParameters[propertyName] = propertyVal;
        } else {
          jobParameters[propertyName] = propertyVal;
        }
      });

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
  }

  @action
  confirmStartBuild() {
    setProperties(this, {
      isShowingModal: true,
      showTooltip: false
    });
  }

  @action
  cancelStartBuild() {
    set(this, 'isShowingModal', false);
  }

  @action
  startDetachedBuildAction(options) {
    set(this, 'isShowingModal', false);
    this.startDetachedBuild(this.tooltipData.job, options).then(() => {
      this.set('reason', '');
    });
  }
}
