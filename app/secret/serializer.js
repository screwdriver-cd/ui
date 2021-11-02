import classic from 'ember-classic-decorator';
import RESTSerializer from '@ember-data/serializer/rest';
import { assign } from '@ember/polyfills';

@classic
export default class Serializer extends RESTSerializer {
  /**
   * Override the serializeIntoHash method because our screwed up API doesn't have model names as a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot, options) {
    if (!snapshot.id) {
      return assign(hash, this.serialize(snapshot, options));
    }

    const dirty = snapshot.changedAttributes();

    Object.keys(dirty).forEach(key => {
      dirty[key] = dirty[key][1];
    });

    return assign(hash, dirty);
  }
}
