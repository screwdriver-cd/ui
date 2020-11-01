import { assign } from '@ember/polyfills';
import DS from 'ember-data';
import _ from 'underscore';

export const sortWorkflowGraph = workflowGraph => {
  if (workflowGraph) {
    if (workflowGraph.nodes) {
      workflowGraph.nodes = _.sortBy(workflowGraph.nodes, node => {
        return `${node.name}_____${node.id}`;
      });
    }
    if (workflowGraph.edges) {
      workflowGraph.edges = _.sortBy(workflowGraph.edges, edge => {
        return `${edge.src}_____${edge.dest}`;
      });
    }
  }
};

export default DS.RESTSerializer.extend({
  normalizeResponse(store, typeClass, payload, id, requestType) {
    if (payload.events) {
      payload.events.forEach(event => {
        sortWorkflowGraph(event.workflowGraph);
      });
    } else if (payload.event && payload.event.workflowGraph) {
      sortWorkflowGraph(payload.event.workflowGraph);
    }

    return this._super(store, typeClass, payload, id, requestType);
  },
  /**
   * Override the serializeIntoHash method to handle model names without a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const data = {
      pipelineId: snapshot.attr('pipelineId'),
      startFrom: snapshot.attr('startFrom'),
      prNum: snapshot.attr('prNum')
    };

    if (snapshot.attr('causeMessage')) {
      data.causeMessage = snapshot.attr('causeMessage');
    }

    if (snapshot.attr('parentBuildId')) {
      data.parentBuildId = parseInt(snapshot.attr('parentBuildId'), 10);
    }

    if (snapshot.attr('parentEventId')) {
      data.parentEventId = parseInt(snapshot.attr('parentEventId'), 10);
    }

    if (snapshot.attr('groupEventId')) {
      data.groupEventId = parseInt(snapshot.attr('groupEventId'), 10);
    }

    if (snapshot.attr('buildId')) {
      data.buildId = parseInt(snapshot.attr('buildId'), 10);
    }

    if (snapshot.attr('meta')) {
      data.meta = snapshot.attr('meta');
    }

    return assign(hash, data);
  }
});
