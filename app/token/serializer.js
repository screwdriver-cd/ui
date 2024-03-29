import RESTSerializer from '@ember-data/serializer/rest';
import { assign } from '@ember/polyfills';

export default RESTSerializer.extend({
  /**
   * Override the serializeIntoHash method
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const dirty = snapshot.changedAttributes();

    Object.keys(dirty).forEach(key => {
      dirty[key] = dirty[key][1];
    });

    const h = assign(hash, dirty);

    delete h.lastUsed;
    delete h.userId;
    delete h.action;
    delete h.pipelineId;

    return h;
  }
});
