import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isComplete, isSkipped } from 'screwdriver-ui/utils/pipeline/event';
import { getDisplayJobNameLength, getWorkflowGraph } from './util';
import { extractEventStages } from '../../../utils/graph-tools';

const PR_CLOSED_EVENT = '~pr-closed';
const BUILD_QUEUE_NAME = 'graph';
const STAGE_BUILD_QUEUE_NAME = 'stageBuilds';
const LATEST_COMMIT_EVENT_QUEUE_NAME = 'latestCommitEvent';
const OPEN_PRS_QUEUE_NAME = 'openPrs';
const RESTRICT_PR_ANNOTATION = 'screwdriver.cd/restrictPR';

export default class PipelineWorkflowComponent extends Component {
  @service router;

  @service('shuttle') shuttle;

  @service('pipeline-page-state') pipelinePageState;

  @service('workflow-data-reload') workflowDataReload;

  @service('settings') settings;

  @tracked showDownstreamTriggers;

  @tracked showTooltip;

  @tracked showStageTooltip;

  @tracked d3Data;

  pipeline;

  userSettings;

  @tracked event;

  @tracked selectedEvent;

  @tracked latestEvent;

  @tracked builds;

  @tracked stageBuilds;

  @tracked workflowGraphToDisplay;

  @tracked showGraph;

  @tracked showEventJobsTable;

  @tracked collapsedStages;


  workflowGraph;

  workflowGraphWithDownstreamTriggers;

  dataReloadId;

  constructor() {
    super(...arguments);

    this.initialize();
    this.showGraph = true;
    this.showEventJobsTable = false;
  }

  initialize() {
    this.event = null;
    this.selectedEvent = null;
    this.builds = null;
    this.stageBuilds = null;
    this.workflowGraphToDisplay = null;
    this.showTooltip = false;
    this.showStageTooltip = false;
    this.d3Data = null;
    this.collapsedStages = new Set([]);
    this.showPRJobs = true;
    this.pipeline = this.pipelinePageState.getPipeline();
    this.userSettings = this.settings.getSettings();
    this.showDownstreamTriggers =
      this.pipeline.settings?.showEventTriggers || false;
    this.latestEvent = this.args.latestEvent;
    this.dataReloadId = this.workflowDataReload.start(
      this.pipeline.id,
      this.pipelinePageState.getIsPr()
    );

    const pipelinePreference = this.userSettings[this.pipeline.id];

    this.showPRJobs =
      pipelinePreference === undefined ||
      pipelinePreference.showPRJobs === undefined
        ? true
        : pipelinePreference.showPRJobs;

    if (this.args.noEvents) {
      this.monitorForNewEvents();
    } else {
      this.monitorForNewBuilds();
    }
  }

  monitorForNewEvents() {
    const pipelineId = this.pipeline.id;

    if (this.pipelinePageState.getIsPr()) {
      this.workflowDataReload.registerOpenPrsCallback(
        OPEN_PRS_QUEUE_NAME,
        pipelineId,
        openPrs => {
          if (openPrs.length > 0) {
            this.workflowDataReload.removeOpenPrsCallback(
              OPEN_PRS_QUEUE_NAME,
              pipelineId
            );
            const transition = this.router.replaceWith(
              'v2.pipeline.pulls.show',
              openPrs[0]
            );

            transition.data = {
              prNums: openPrs
            };
          }
        }
      );
    } else {
      this.workflowDataReload.registerLatestCommitEventCallback(
        LATEST_COMMIT_EVENT_QUEUE_NAME,
        pipelineId,
        latestCommitEvent => {
          if (latestCommitEvent) {
            this.workflowDataReload.removeLatestCommitEventCallback(
              LATEST_COMMIT_EVENT_QUEUE_NAME,
              pipelineId
            );

            const transition = this.router.replaceWith(
              'v2.pipeline.events.show',
              latestCommitEvent.id
            );

            transition.data = { latestEvent: latestCommitEvent };
          }
        }
      );
    }
  }

  monitorForNewBuilds() {
    if (this.args.event) {
      this.event = this.args.event;

      this.workflowDataReload.registerBuildsCallback(
        BUILD_QUEUE_NAME,
        this.event.id,
        this.buildsCallback
      );

      const { workflowGraph } = this.event;
      const eventStages = extractEventStages(workflowGraph);

      if (eventStages.length) {
        this.workflowDataReload.registerStageBuildsCallback(
          STAGE_BUILD_QUEUE_NAME,
          this.event.id,
          this.stageBuildsCallback
        );
      }

      this.setWorkflowGraphFromEvent();
    }
  }

  willDestroy() {
    super.willDestroy();

    this.workflowDataReload.stop(this.dataReloadId);
  }

  @action
  update(element, [event, pipelineId]) {
    if (this.pipeline.id !== pipelineId) {
      this.workflowDataReload.stop(this.dataReloadId);
      this.initialize();

      return;
    }

    if (this.event) {
      if (this.event.id === event.id) {
        return;
      }

      this.workflowDataReload.removeBuildsCallback(
        BUILD_QUEUE_NAME,
        this.event.id
      );

      this.workflowDataReload.removeStageBuildsCallback(
        STAGE_BUILD_QUEUE_NAME,
        this.event.id
      );
    }

    const { workflowGraph } = event;
    const hasStages = !!extractEventStages(workflowGraph).length;
    const builds = this.workflowDataReload.getBuildsForEvent(event.id);

    this.event = event;
    this.builds = builds;
    this.showTooltip = false;
    this.showStageTooltip = false;

    const hasEventCompleted = this.isEventComplete(builds);

    if (!hasEventCompleted) {
      this.workflowDataReload.registerBuildsCallback(
        BUILD_QUEUE_NAME,
        event.id,
        this.buildsCallback
      );
    }

    if (hasStages) {
      const stageBuilds = this.workflowDataReload.getStageBuildsForEvent(
        event.id
      );

      this.stageBuilds = stageBuilds;

      if (!stageBuilds || !hasEventCompleted) {
        this.workflowDataReload.registerStageBuildsCallback(
          STAGE_BUILD_QUEUE_NAME,
          event.id,
          this.stageBuildsCallback
        );
      }
    }

    this.setWorkflowGraphFromEvent();
  }

  @action
  setWorkflowGraphFromEvent() {
    const { workflowGraph } = this.event;

    this.workflowGraph = getWorkflowGraph(workflowGraph, null);
    this.workflowGraphWithDownstreamTriggers = getWorkflowGraph(
      workflowGraph,
      this.pipelinePageState.getTriggers()
    );
    this.workflowGraphToDisplay = this.showDownstreamTriggers
      ? this.workflowGraphWithDownstreamTriggers
      : this.workflowGraph;
  }

  @action
  buildsCallback(builds) {
    this.builds = builds;

    if (this.isEventComplete(builds)) {
      this.workflowDataReload.removeBuildsCallback(
        BUILD_QUEUE_NAME,
        this.event.id
      );
    }
  }

  @action
  stageBuildsCallback(stageBuilds) {
    this.stageBuilds = stageBuilds;

    if (this.isEventComplete(this.builds)) {
      this.workflowDataReload.removeStageBuildsCallback(
        STAGE_BUILD_QUEUE_NAME,
        this.event.id
      );
    }
  }

  isEventComplete(builds) {
    return isSkipped(this.event, builds) || isComplete(builds);
  }

  get isPR() {
    return this.pipelinePageState.getIsPr();
  }

  get isPRClosed() {
    return this.event?.startFrom === PR_CLOSED_EVENT;
  }

  get eventRailAnchor() {
    return this.args.invalidEvent ? this.latestEvent : this.event;
  }

  get displayJobNameLength() {
    return getDisplayJobNameLength(this.userSettings);
  }

  get hasDownstreamTriggers() {
    return (
      this.workflowGraph.nodes.length !==
      this.workflowGraphWithDownstreamTriggers.nodes.length
    );
  }

  get hasPrRestrictions() {
    if (!this.isPR && !this.isPRClosed) {
      return false;
    }

    if (
      this.pipeline.annotations &&
      Object.hasOwn(this.pipeline.annotations, RESTRICT_PR_ANNOTATION)
    ) {
      const restriction = this.pipeline.annotations[RESTRICT_PR_ANNOTATION];

      return restriction !== 'none';
    }

    return false;
  }

  get hasForkPrRestriction() {
    if (!this.hasPrRestrictions) {
      return false;
    }

    const restriction = this.pipeline.annotations[RESTRICT_PR_ANNOTATION];

    return restriction === 'fork' || restriction === 'all';
  }

  get hasBranchPrRestriction() {
    if (!this.hasPrRestrictions) {
      return false;
    }

    const restriction = this.pipeline.annotations[RESTRICT_PR_ANNOTATION];

    return restriction === 'branch' || restriction === 'all';
  }

  @action
  toggleShowDownstreamTriggers() {
    this.showDownstreamTriggers = !this.showDownstreamTriggers;

    this.workflowGraphToDisplay = this.showDownstreamTriggers
      ? this.workflowGraphWithDownstreamTriggers
      : this.workflowGraph;
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

  @action
  toggleStageView(stageName, isCollapsed) {
    const collapsedStages = new Set(this.collapsedStages);

    if (isCollapsed) {
      collapsedStages.add(stageName);
    } else {
      collapsedStages.delete(stageName);
    }

    this.collapsedStages = collapsedStages;
  }

  @action
  setShowGraph() {
    this.showGraph = true;
    this.showEventJobsTable = false;
  }

  @action
  setShowEventJobsTable() {
    this.showGraph = false;
    this.showEventJobsTable = true;
  }

  @action
  setShowBuildCostsTable() {
    this.showGraph = false;
    this.showEventJobsTable = false;
  }
}
