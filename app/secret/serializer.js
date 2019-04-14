import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash method because our screwed up API doesn't have model names as a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot, options) {
    if (!snapshot.id) {
      return merge(hash, this.serialize(snapshot, options));
    }

    const dirty = snapshot.changedAttributes();

    Object.keys(dirty).forEach(key => {
      dirty[key] = dirty[key][1];
    });

    return merge(hash, dirty);
  }
});
