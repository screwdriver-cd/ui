import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import EmberObject, { getWithDefault } from '@ember/object';
import { all, Promise as EmberPromise } from 'rsvp';
import { copy } from 'ember-copy';
import $ from 'jquery';
import { debounce, later } from '@ember/runloop';

import { removeBranch } from 'screwdriver-ui/utils/graph-tools';

/**
 * Check whether given job name is an external trigger
 * @param  {String}  jobName
 * @return {Boolean} true if is an external trigger, false otherwise
 */
function isExternalTrigger(jobName) {
  return /^~?sd@/.test(jobName);
}

/**
 * prefix job name with pipelineId
 * @param  {String} jobName
 * @param  {String} pipelineId
 * @return {String} concatenated string
 */
function prefixJobName(jobName, pipelineId) {
  if (['~pr', '~commit'].includes(jobName)) {
    return jobName;
  }

  return `~sd@${pipelineId}:${jobName}`;
}

export default Controller.extend({
  session: service(),
  store: service(),
  shuttle: service(),
  pipelines: [],
  selectedPipeline: null,
  connectedPipelines: [],
  selectedConnectedPipeline: null,
  queryParams: ['selectedPipelineId', 'selectedConnectedPipelineId'],
  selectedPipelineId: null,
  selectedConnectedPipelineId: null,

  async extractConnectedPipelines(pipeline) {
    const edges = getWithDefault(pipeline, 'workflowGraph.edges', []);

    let upstreams = new Set();

    let downstreams = new Set();

    edges.forEach(e => {
      if (isExternalTrigger(e.src)) {
        upstreams.add(e.src);
      }
      if (isExternalTrigger(e.dest)) {
        downstreams.add(e.dest);
      }
    });

    const connectedJobs = Array.from(upstreams).concat(Array.from(downstreams));

    let connectedPipelines = [];

    try {
      const connectedPipelineIds = new Set();

      connectedJobs.forEach(connectedJobName => {
        const pipelineWithJobName = connectedJobName.split('@')[1];
        const pipelineId = pipelineWithJobName.split(':')[0];

        connectedPipelineIds.add(pipelineId);
      });

      connectedPipelineIds.delete(`${pipeline.id}`);

      const connectedPipelinesPromises = Array.from(connectedPipelineIds).map(
        pipelineId => this.store.findRecord('pipeline', pipelineId)
      );

      connectedPipelines = await all(connectedPipelinesPromises);

      return connectedPipelines;
    } catch (e) {
      return [];
    }
  },

  async selectPipeline(selectedPipeline) {
    let pipelineGraph;

    if (selectedPipeline instanceof EmberObject) {
      pipelineGraph = selectedPipeline.toJSON({ includeId: true });
    } else {
      pipelineGraph = copy(selectedPipeline, true);
    }

    let { workflowGraph } = pipelineGraph;

    workflowGraph.nodes.forEach(n => {
      if (!isExternalTrigger(n.name)) {
        n.name = prefixJobName(n.name, selectedPipeline.id);
      }
    });

    workflowGraph.edges.forEach(e => {
      if (!isExternalTrigger(e.src)) {
        e.src = prefixJobName(e.src, selectedPipeline.id);
      }

      if (!isExternalTrigger(e.dest)) {
        e.dest = prefixJobName(e.dest, selectedPipeline.id);
      }
    });

    const connectedPipelines = await this.extractConnectedPipelines(
      pipelineGraph
    );

    if (connectedPipelines.length) {
      const prNode = workflowGraph.nodes.findBy('name', '~pr');
      const commitNode = workflowGraph.nodes.findBy('name', '~commit');

      removeBranch(prNode, workflowGraph);
      removeBranch(commitNode, workflowGraph);

      connectedPipelines.forEach(p => {
        p.workflowGraph.nodes.forEach(n => {
          if (!['~pr', '~commit'].includes(n.name)) {
            let { name } = n;

            if (!isExternalTrigger(n.name)) {
              name = `~sd@${p.id}:${n.name}`;
            }

            if (!workflowGraph.nodes.findBy('name', name)) {
              workflowGraph.nodes.push({
                name,
                id: n.id
              });
            }
          }
        });

        p.workflowGraph.edges.forEach(e => {
          if (!['~pr', '~commit'].includes(e.src)) {
            let { src } = e;

            let { dest } = e;

            if (!isExternalTrigger(e.src)) {
              src = `~sd@${p.id}:${e.src}`;
            }

            if (!isExternalTrigger(e.dest)) {
              dest = `~sd@${p.id}:${e.dest}`;
            }

            if (
              !workflowGraph.edges.find(
                ed => ed.src === src && ed.dest === dest
              )
            ) {
              workflowGraph.edges.push({ src, dest });
            }
          }
        });
      });
    }

    connectedPipelines.unshiftObject(selectedPipeline);

    if (this.selectedConnectedPipeline) {
      this.setProperties({
        pipelineGraph,
        connectedPipelines
      });
      this.highlightPipeline(this.selectedConnectedPipeline.id);
    } else {
      this.setProperties({
        selectedConnectedPipeline: selectedPipeline,
        pipelineGraph,
        connectedPipelines
      });
      this.highlightPipeline(selectedPipeline.id);
    }
  },

  highlightPipeline(pipelineId) {
    later(() => {
      $('div.workflow .graph-label').each((_, el) => {
        if (el.textContent.includes(`~sd@${pipelineId}:`)) {
          $(el).addClass('highlight');
        } else {
          $(el).removeClass('highlight');
        }
      });
    });
  },

  async searchPipeline(pipelineName, resolve, reject) {
    try {
      const pipelines = await this.shuttle.searchPipelines(pipelineName);

      this.set('pipelines', pipelines);
      resolve(pipelines);
    } catch (e) {
      reject(e);
    }
  },

  actions: {
    async selectPipeline(selectedPipeline) {
      const selectedPipelineId = selectedPipeline.id;

      this.transitionToRoute('pipeline-visualizer', {
        queryParams: {
          selectedPipelineId,
          selectedConnectedPipelineId: selectedPipelineId
        }
      });
    },

    selectConnectedPipeline(selectedConnectedPipeline) {
      this.set('selectedConnectedPipeline', selectedConnectedPipeline);

      this.highlightPipeline(this.selectedConnectedPipeline.id);

      this.set(
        'selectedConnectedPipelineId',
        this.selectedConnectedPipeline.id
      );
    },

    async searchPipeline(pipelineName) {
      return new EmberPromise((resolve, reject) => {
        debounce(
          this,
          this.searchPipeline,
          pipelineName,
          resolve,
          reject,
          1000
        );
      });
    }
  }
});
