import { assign } from '@ember/polyfills';
import DS from 'ember-data';
import _s from 'underscore.string';

export const sortWorkflowGraph = workflowGraph => {
  if (workflowGraph) {
    if (workflowGraph.nodes) {
      workflowGraph.nodes.sort((node1, node2) => {
        return (
          _s.naturalCmp(node1.name, node2.name) ||
          _s.naturalCmp(node1.id ? node1.id.toString() : '', node2.id ? node2.id.toString() : '')
        );
      });
    }
    if (workflowGraph.edges) {
      workflowGraph.edges.sort((edge1, edge2) => {
        return _s.naturalCmp(edge1.src, edge2.src) || _s.naturalCmp(edge1.dest, edge2.dest);
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
