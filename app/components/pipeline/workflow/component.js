import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { service } from '@ember/service';
import { isComplete, isSkipped } from 'screwdriver-ui/utils/pipeline/event';
import { getDisplayJobNameLength, getWorkflowGraph } from './util';

const BUILD_QUEUE_NAME = 'graph';
const RELOAD_ID = 'pipeline';

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

  @tracked latestCommitEvent;

  @tracked builds;

  @tracked jobs;

  @tracked stages;

  @tracked triggers;

  @tracked workflowGraphToDisplay;

  workflowGraph;

  workflowGraphWithDownstreamTriggers;

  constructor() {
    super(...arguments);

    const { pipeline } = this.args;

    this.pipeline = pipeline;
    this.userSettings = this.args.userSettings;

    this.workflowDataReload.start(this.args.pipeline.id);

    if (this.args.noEvents) {
      this.workflowDataReload.registerLatestCommitEventCallback(
        BUILD_QUEUE_NAME,
        RELOAD_ID,
        latestCommitEvent => {
          if (latestCommitEvent) {
            this.workflowDataReload.removeLatestCommitEventCallback(
              BUILD_QUEUE_NAME,
              RELOAD_ID
            );

            const transition = this.router.replaceWith(
              'v2.pipeline.events.show',
              latestCommitEvent.id
            );

            transition.data = { latestCommitEvent };
          }
        }
      );
    } else {
      this.jobs = this.args.jobs;
      this.stages = this.args.stages;
      this.triggers = this.args.triggers;
      this.latestCommitEvent = this.args.latestCommitEvent;

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
  }

  willDestroy() {
    super.willDestroy();

    this.workflowDataReload.stop();
  }

  @action
  update(element, [event]) {
    const builds = this.workflowDataReload.getBuildsForEvent(event.id);

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
  buildsCallback(builds, latestCommitEvent) {
    this.builds = builds;
    this.latestCommitEvent = latestCommitEvent;

    if (isSkipped(this.event, builds) || isComplete(builds)) {
      this.workflowDataReload.removeBuildsCallback(
        BUILD_QUEUE_NAME,
        this.event.id
      );
    }
  }

  get eventRailAnchor() {
    return this.args.invalidEvent ? this.latestCommitEvent : this.event;
  }

  get displayJobNameLength() {
    return getDisplayJobNameLength(this.userSettings);
  }

  get disableDownstreamTriggers() {
    return (
      this.workflowGraph.nodes.length ===
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
}
