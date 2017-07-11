import DS from 'ember-data';
import Ember from 'ember';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash method
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const dirty = snapshot.changedAttributes();

    Object.keys(dirty).forEach((key) => {
      dirty[key] = dirty[key][1];
    });

    const h = Ember.merge(hash, dirty);

    delete h.lastUsed;
    delete h.userId;
    delete h.action;

    return h;
  }
});
