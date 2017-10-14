import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    return merge(hash, { checkoutUrl: snapshot.attr('checkoutUrl') });
  }
});
