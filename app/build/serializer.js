import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  attrs: {
    buildContainer: 'container'
  },
  /**
   * Overrride and fill in `statusMessage` so the model can merge properly
   */
  normalizeResponse(store, typeClass, payload, id, requestType) {
    if (payload.build) {
      payload.build.statusMessage = payload.build.statusMessage || null;
    }

    return this._super(store, typeClass, payload, id, requestType);
  },

  /**
   * Override the serializeIntoHash method to handle model names without a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    if (!snapshot.id) {
      return merge(hash, { jobId: snapshot.attr('jobId') });
    }

    return merge(hash, { status: snapshot.attr('status') });
  }
});
