import RESTSerializer from '@ember-data/serializer/rest';
import { assign } from '@ember/polyfills';

export default RESTSerializer.extend({
  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const dirty = snapshot.changedAttributes();

    Object.keys(dirty).forEach(key => {
      dirty[key] = dirty[key][1];
    });

    return assign(hash, dirty);
  }
});
