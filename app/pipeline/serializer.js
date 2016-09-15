import DS from 'ember-data';
import Ember from 'ember';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash method because our screwed up API doesn't have model names as a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot, options) {
    if (!snapshot.id) {
      return Ember.merge(hash, { scmUrl: snapshot.attr('scmUrl') });
    }

    return Ember.merge(hash, this.serialize(snapshot, options));
  }
});
