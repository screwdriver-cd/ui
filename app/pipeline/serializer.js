import DS from 'ember-data';
import Ember from 'ember';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    return Ember.merge(hash, { checkoutUrl: snapshot.attr('scmUrl') });
  }
});
