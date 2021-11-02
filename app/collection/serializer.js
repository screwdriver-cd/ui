import classic from 'ember-classic-decorator';
import RESTSerializer from '@ember-data/serializer/rest';
import { assign } from '@ember/polyfills';

@classic
export default class Serializer extends RESTSerializer {
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

    return h;
  }
}
