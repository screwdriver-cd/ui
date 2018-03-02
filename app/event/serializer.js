import { merge } from '@ember/polyfills';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  /**
   * Override the serializeIntoHash method to handle model names without a root key
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const data = {
      pipelineId: snapshot.attr('pipelineId'),
      startFrom: snapshot.attr('startFrom')
    };

    if (snapshot.attr('causeMessage')) {
      data.causeMessage = snapshot.attr('causeMessage');
    }

    if (snapshot.attr('parentBuildId')) {
      data.parentBuildId = parseInt(snapshot.attr('parentBuildId'), 10);
    }

    if (snapshot.attr('parentEventId')) {
      data.parentEventId = parseInt(snapshot.attr('parentEventId'), 10);
    }

    return merge(hash, data);
  }
});
