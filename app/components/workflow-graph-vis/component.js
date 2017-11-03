/* global vis */
import { get, getWithDefault, computed, set } from '@ember/object';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import DS from 'ember-data';

export default Component.extend({
  router: service(),
  nodes: computed({
    get() {
      const nodes = getWithDefault(this, 'workflowGraph.nodes', []);
      const startFrom = get(this, 'startFrom');
      const causeMessage = get(this, 'causeMessage');
      let list = nodes.map(n => ({ id: n.name, label: n.name }));
      const builds = get(this, 'builds');

      if ((Array.isArray(builds) && builds.length) ||
        (builds instanceof DS.PromiseArray && builds.get('length'))) {
        list = nodes.map((n) => {
          const obj = { id: n.name, label: n.name };
          const build = builds.find(j => `${j.get('jobId')}` === `${n.id}`);

          // If startFrom is a trigger, e.g. ~commit, ~sd@123:main, then highlight it
          if (startFrom && startFrom.startsWith('~') && n.name === startFrom) {
            obj.color = '#1ac567';
            obj.icon = { code: '\uf05d', color: '#1ac567' };
            if (startFrom.startsWith('~sd@')) {
              obj.buildId = causeMessage.match(/\d+/)[0];
            }
          }

          if (build) {
            obj.status = get(build, 'status');
            obj.buildId = get(build, 'id');
            obj.sha = get(build, 'sha');
            obj.title = obj.status;

            // TODO: graph icons work, but look terrible
            switch (obj.status) {
            case 'SUCCESS':
              obj.color = '#1ac567';
              obj.icon = { code: '\uf05d', color: '#1ac567' };
              break;
            case 'RUNNING':
              obj.color = '#0f69ff';
              obj.icon = { code: '\uf110', color: '#dc142d' };
              break;
            case 'QUEUED':
              obj.color = '#0f69ff';
              obj.icon = { code: '\uf017', color: '#dc142d' };
              break;
            case 'FAILURE':
              obj.color = '#dc142d';
              obj.icon = { code: '\uf05c', color: '#dc142d' };
              break;
            case 'ABORTED':
              obj.color = '#dc142d';
              obj.icon = { code: '\uf28e', color: '#dc142d' };
              break;
            default:
            }
          }

          return obj;
        });
      }

      return list;
    }
  }),

  edges: computed({
    get() {
      const edges = getWithDefault(this, 'workflowGraph.edges', []);

      // TODO: Probably should only color edges from a successful build
      return edges.map(e => ({
        from: `${e.src}`,
        to: `${e.dest}`
      }));
    }
  }),

  didInsertElement() {
    this._super(...arguments);

    this.createNetwork();
  },

  // TODO: Listen for changes to nodes/edges and update graph accordingly.

  createNetwork() {
    const options = {
      width: '400px',
      height: '150px',
      manipulation: { enabled: false },
      layout: {
        hierarchical: {
          enabled: true,
          direction: 'LR',
          sortMethod: 'directed'
        }
      },
      interaction: {
        dragView: false,
        zoomView: false,
        dragNodes: false,
        hover: true
      },
      nodes: {
        color: '#eeeeee',
        shape: 'dot'
      },
      edges: {
        arrows: {
          to: {
            enabled: true
          }
        },
        smooth: {
          type: 'discrete',
          forceDirection: 'none'
        }
      },
      physics: {
        enabled: false
      }
    };

    const nodeSet = get(this, 'nodes');
    const edgeSet = get(this, 'edges');
    const el = this.$('.vis-network-graph')[0];
    const nodes = new vis.DataSet(nodeSet);
    const edges = new vis.DataSet(edgeSet);
    const network = new vis.Network(el, { nodes, edges }, options);

    network.on('selectNode', (e) => {
      const node = nodeSet.find(n => e.nodes[0] === n.id);

      if (node.buildId) {
        const router = get(this, 'router');
        // Hack to make click route to build page
        let url = router.urlFor('pipeline.builds.build', node.buildId);

        if (node.id.startsWith('~sd@')) {
          const pipelineId = node.id.match(/^~sd@(\d+):([\w-]+)$/)[1];

          url = router.urlFor('pipeline.builds.build', pipelineId, node.buildId);
        }

        router.transitionTo(url);
      }
    });

    set(this, 'network', network);
  }
});
