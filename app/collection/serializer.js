import { assign } from '@ember/polyfills';
import RESTSerializer, {
  EmbeddedRecordsMixin
} from '@ember-data/serializer/rest';

export default RESTSerializer.extend(EmbeddedRecordsMixin, {
  attrs: {
    pipelines: { embedded: 'always' }
  },

  normalizeResponse(store, typeClass, payload, id, requestType) {
    if (requestType === 'findRecord') {
      payload.collection.pipelines.forEach(p => {
        p.links = {
          metrics: `/v4/pipelines/${p.id}/metrics?count=20&page=1`
        };
      });
    }

    return this._super(store, typeClass, payload, id, requestType);
  },
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
});
