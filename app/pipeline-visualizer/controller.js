import { inject as service } from '@ember/service';
import Controller from '@ember/controller';
import EmberObject, { getWithDefault } from '@ember/object';
import { all } from 'rsvp';
import { copy } from 'ember-copy';
import $ from 'jquery';
import { debounce, later } from '@ember/runloop'
import { Promise as EmberPromise } from 'rsvp';
import { removeBranch } from 'screwdriver-ui/utils/graph-tools';

function isExternalTrigger(jobName) {
  return /^~?sd@/.test(jobName);
}

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
    console.log('extractConnectedPipelines', pipeline);
    let upstreams = new Set();
    let downstreams = new Set();

    const edges = getWithDefault(pipeline, 'workflowGraph.edges', []);

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

      connectedJobs.forEach((connectedJobName) => {
        const pipelineWithJobName = connectedJobName.split('@')[1];
        const pipelineId = pipelineWithJobName.split(':')[0];
        connectedPipelineIds.add(pipelineId);
      });

      connectedPipelineIds.delete(`${pipeline.id}`);

      const connectedPipelinesPromises = Array.from(connectedPipelineIds).map(pipelineId => {
        // return this.shuttle.getLatestCommitEvent(pipelineId);
        return this.store.findRecord('pipeline', pipelineId);
      });

      connectedPipelines = await all(connectedPipelinesPromises);
    } catch (e) {
      console.log('error', e);
      throw e;
    } finally {
      console.log('connectedPipelines', connectedPipelines);

      return connectedPipelines;
    }
  },

  async selectPipeline(selectedPipeline) {
    let pipelineGraph;

    if (selectedPipeline instanceof EmberObject) {
      pipelineGraph = selectedPipeline.toJSON({ includeId: true });
    } else {
      pipelineGraph = copy(selectedPipeline, true);
    }

    console.log('before aggregated pipelineGraph', pipelineGraph);

    let workflowGraph = pipelineGraph.workflowGraph;

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

    console.log('after prefixJobName', pipelineGraph);

    const connectedPipelines = await this.extractConnectedPipelines(pipelineGraph);

    if (connectedPipelines.length) {
      const prNode = workflowGraph.nodes.findBy('name', '~pr');
      const commitNode = workflowGraph.nodes.findBy('name', '~commit');

      removeBranch(prNode, workflowGraph);
      removeBranch(commitNode, workflowGraph);

      connectedPipelines.forEach(p => {
        p.workflowGraph.nodes.forEach(n => {
          if (!['~pr', '~commit'].includes(n.name)) {
            let name = n.name;

            if (!isExternalTrigger(n.name)) {
              name = `~sd@${p.id}:${n.name}`;
              console.log('push', name, 'to pipeline', selectedPipeline.id);
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
            let src = e.src;
            let dest = e.dest;

            if (!isExternalTrigger(e.src)) {
              src = `~sd@${p.id}:${e.src}`;
            }

            if (!isExternalTrigger(e.dest)) {
              dest = `~sd@${p.id}:${e.dest}`;
            }

            if (!workflowGraph.edges.find((ed) => ed.src === src && ed.dest === dest)) {
              workflowGraph.edges.push({ src, dest });
            }
          }
        });
      });
    }

    console.log('after aggregated pipelineGraph', pipelineGraph);

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
    console.log('pipelineName', pipelineName);

    try {
      const pipelines = await this.shuttle.searchPipelines(pipelineName);
      console.log('pipelines', pipelines);
      this.set('pipelines', pipelines);
      resolve(pipelines);
    } catch (e) {
      console.log('searchPipeline', searchPipeline, 'err', e);
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
      console.log('before selectedConnectedPipeline.id', this.selectedConnectedPipeline.id);
      this.set('selectedConnectedPipeline', selectedConnectedPipeline);
      console.log('after selectedConnectedPipeline.id', this.selectedConnectedPipeline.id);

      this.highlightPipeline(this.selectedConnectedPipeline.id);
      this.set('selectedConnectedPipelineId', this.selectedConnectedPipeline.id);
    },

    async searchPipeline(pipelineName) {
      return new EmberPromise((resolve, reject) => {
        debounce(this, this.searchPipeline, pipelineName, resolve, reject, 1000);
      });
    }
  }
});
