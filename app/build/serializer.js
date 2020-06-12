import { assign } from '@ember/polyfills';
import { get } from '@ember/object';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  attrs: {
    buildContainer: 'container'
  },
  /**
     * Overrride and fill in `statusMessage` so the model can assign properly
     */
  normalizeResponse(store, typeClass, payload, id, requestType) {
    if (payload.build) {
      payload.build.statusMessage = payload.build.statusMessage || null;
    }

    if (requestType === 'findHasMany' && Array.isArray(payload.builds)) {
      payload.builds
        .filter(b => store.hasRecordForId('build', b.id))
        .forEach(b => {
          let storeBuild = store.peekRecord('build', b.id);

          if (storeBuild) {
            b.steps = get(storeBuild, 'steps').toArray();
          }
        });
    }

    return this._super(store, typeClass, payload, id, requestType);
  },

  /**
     * Override the serializeIntoHash method to handle model names without a root key
     * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
     * @method serializeIntoHash
     */
  serializeIntoHash(hash, typeClass, snapshot) {
    if (!snapshot.id) {
      return assign(hash, { jobId: snapshot.attr('jobId') });
    }

    return assign(hash, { status: snapshot.attr('status') });
  }
});
