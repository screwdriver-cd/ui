import DS from 'ember-data';
import Ember from 'ember';

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
      return Ember.merge(hash, { jobId: snapshot.attr('jobId') });
    }

    return Ember.merge(hash, { status: snapshot.attr('status') });
  }
});
