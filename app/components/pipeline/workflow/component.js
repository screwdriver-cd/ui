import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isComplete, isSkipped } from 'screwdriver-ui/utils/pipeline/event';
import { getDisplayJobNameLength, getWorkflowGraph } from './util';

const PIPELINE_EVENT = 'pipeline';
const PR_EVENT = 'pr';
const BUILD_QUEUE_NAME = 'graph';
const LATEST_COMMIT_EVENT_QUEUE_NAME = 'latestCommitEvent';
const OPEN_PRS_QUEUE_NAME = 'openPrs';

export default class PipelineWorkflowComponent extends Component {
  @service router;

  @service shuttle;

  @service workflowDataReload;

  @tracked showDownstreamTriggers = false;

  @tracked showTooltip = false;

  @tracked showStageTooltip = false;

  @tracked d3Data = null;

  pipeline;

  userSettings;

  @tracked event;

  @tracked selectedEvent;

  @tracked latestEvent;

  @tracked builds;

  @tracked jobs;

  @tracked stages;

  @tracked triggers;

  @tracked workflowGraphToDisplay;

  @tracked showGraph;

  workflowGraph;

  workflowGraphWithDownstreamTriggers;

  eventType;

  dataReloadId;

  constructor() {
    super(...arguments);

    const { pipeline } = this.args;
    const pipelineId = pipeline.id;

    this.pipeline = pipeline;
    this.userSettings = this.args.userSettings;
    this.latestEvent = this.args.latestEvent;
    this.eventType = this.router.currentRouteName.includes('events')
      ? PIPELINE_EVENT
      : PR_EVENT;

    this.dataReloadId = this.workflowDataReload.start(
      pipelineId,
      this.eventType === PR_EVENT
    );

    if (this.args.noEvents) {
      this.monitorForNewEvents();
    } else {
      this.jobs = this.args.jobs;
      this.stages = this.args.stages;
      this.triggers = this.args.triggers;

      this.monitorForNewBuilds();
    }

    this.showGraph = true;
  }

  monitorForNewEvents() {
    const pipelineId = this.pipeline.id;

    if (this.eventType === PR_EVENT) {
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
      this.setWorkflowGraphFromEvent();
    }
  }

  willDestroy() {
    super.willDestroy();

    this.workflowDataReload.stop(this.dataReloadId);
  }

  @action
  update(element, [event]) {
    const builds = this.workflowDataReload.getBuildsForEvent(event.id);

    this.workflowDataReload.removeBuildsCallback(
      BUILD_QUEUE_NAME,
      this.event.id
    );

    if (!this.isEventComplete(event, builds)) {
      this.workflowDataReload.registerBuildsCallback(
        BUILD_QUEUE_NAME,
        event.id,
        this.buildsCallback
      );
    }

    this.event = event;
    this.builds = builds;
    this.showTooltip = false;
    this.showStageTooltip = false;

    this.setWorkflowGraphFromEvent();
  }

  @action
  setWorkflowGraphFromEvent() {
    const { workflowGraph } = this.event;

    this.workflowGraph = getWorkflowGraph(workflowGraph, null);
    this.workflowGraphWithDownstreamTriggers = getWorkflowGraph(
      workflowGraph,
      this.triggers
    );
    this.workflowGraphToDisplay = this.workflowGraph;
  }

  @action
  buildsCallback(builds) {
    this.builds = builds;

    if (this.isEventComplete(this.event, builds)) {
      this.workflowDataReload.removeBuildsCallback(
        BUILD_QUEUE_NAME,
        this.event.id
      );
    }
  }

  isEventComplete(event, builds) {
    return !!(isSkipped(this.event, builds) || isComplete(builds));
  }

  get isPR() {
    return this.eventType === PR_EVENT;
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
  setShowGraph(showGraph) {
    this.showGraph = showGraph;
  }
}
