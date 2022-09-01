import { assign } from '@ember/polyfills';
import DS from 'ember-data';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';


export function extractPayload(payload, options = {}) {
  const { desiredJobNameLength, displayJobNameLength } = payload;
  delete payload.desiredJobNameLength;
  delete payload.displayJobNameLength;

  const preferencePipelines = Object.keys(payload).map((id) => {
    return { id, ...payload[id] };
  });

  const data = {
    'preference/user': {
      id: 1,
      displayJobNameLength,
      'preference/pipelines': preferencePipelines
    }
  }

  return data;
}

export default DS.RESTSerializer.extend(EmbeddedRecordsMixin, {
  attrs: {
    'preference/pipelines': { embedded: 'always' }
  },

  // primaryKey: 'username',

  // normalizeResponse(store, typeClass, payload, id, requestType) {

  // },

  normalizeQueryRecordResponse(store, typeClass, payload, id, requestType) {
    if (requestType === 'queryRecord') {
      // payload.collection.pipelines.forEach(p => {
      //   p.links = {
      //     metrics: `/v4/pipelines/${p.id}/metrics?count=20&page=1`
      //   };
      // });
      console.log('payload here', payload);
    }

    console.log('payload', payload);

    const data = extractPayload(payload);

    console.log('data', data);

    return this._super(store, typeClass, data, id, requestType);
  },

  // normalizeResponse(store, typeClass, payload, id, requestType) {
  //   if (requestType === 'findRecord') {
  //     payload.collection.pipelines.forEach(p => {
  //       p.links = {
  //         metrics: `/v4/pipelines/${p.id}/metrics?count=20&page=1`
  //       };
  //     });
  //   }

  //   return this._super(store, typeClass, payload, id, requestType);
  // },
  // *
  //  * Override the serializeIntoHash method
  //  * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
  //  * @method serializeIntoHash

  // serializeIntoHash(hash, typeClass, snapshot) {
  //   const dirty = snapshot.changedAttributes();

  //   Object.keys(dirty).forEach(key => {
  //     dirty[key] = dirty[key][1];
  //   });

  //   const h = assign(hash, dirty);

  //   return h;
  // }
});
