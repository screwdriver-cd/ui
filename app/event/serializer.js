import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  normalizeResponse(store, typeClass, payload, id, requestType) {
    if (payload.events) {
      payload.events.forEach((event) => {
        if (event.workflowGraph) {
          // sorting on the dest should be enough
          event.workflowGraph.edges = event.workflowGraph.edges.sort(({ dest: a }, { dest: b }) => {
            if (a < b) {
              return -1;
            }
            if (a > b) {
              return 1;
            }

            return 0;
          });
        }
      });
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

    if (snapshot.attr('buildId')) {
      data.buildId = parseInt(snapshot.attr('buildId'), 10);
    }

    return merge(hash, data);
  }
});
