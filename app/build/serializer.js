import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  attrs: {
    buildContainer: 'container'
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
