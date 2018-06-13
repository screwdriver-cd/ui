import { merge } from '@ember/polyfills';
import DS from 'ember-data';

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

    const h = merge(hash, dirty);

    delete h.lastUsed;
    delete h.userId;
    delete h.action;
    delete h.pipelineId;

    return h;
  }
});
