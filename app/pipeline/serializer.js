import { assign } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  normalizeResponse(store, typeClass, payload, id, requestType) {
    const { pipeline } = payload;

    if (pipeline && pipeline.workflowGraph) {
      // sorting on the dest should be enough
      pipeline.workflowGraph.edges.sort(({ dest: a }, { dest: b }) => {
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }

        return 0;
      });
    }

    return this._super(store, typeClass, payload, id, requestType);
  },

  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    return assign(hash, {
      checkoutUrl: snapshot.attr('checkoutUrl'),
      rootDir: snapshot.attr('rootDir') || ''
    });
  }
});
