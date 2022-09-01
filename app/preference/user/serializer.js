import DS from 'ember-data';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { getWithDefault } from '@ember/object';

export function extractPayload(payload) {
  const { desiredJobNameLength, displayJobNameLength } = payload;
  delete payload.desiredJobNameLength;
  delete payload.displayJobNameLength;

  const preferencePipelines = Object.keys(payload).map(id => {
    const parsed = parseInt(id, 10);

    if (Number.isInteger(parsed)) {
      return { id, ...payload[id] };
    }
  });

  const data = {
    'preference/user': {
      id: 1,
      displayJobNameLength,
      'preference/pipelines': preferencePipelines
    }
  };

  return data;
}

export function preparePayload(preferenceUser) {
  const { displayJobNameLength } = preferenceUser;
  const data = { displayJobNameLength };
  const preferencePipelines = preferenceUser['preference/pipelines'] ?? [];

  preferencePipelines.forEach(({id, showPRJobs }) => {
    data[id] = {
      showPRJobs
    }
  });

  return data;
}

export default DS.RESTSerializer.extend(EmbeddedRecordsMixin, {
  attrs: {
    'preference/pipelines': { embedded: 'always' }
  },

  normalizeResponse(store, typeClass, payload, id, requestType) {
    let data = payload;

    if (['queryRecord', 'updateRecord'].includes(requestType)) {
      console.log('payload here', payload);
      console.log('payload', payload);

      data = extractPayload(payload);

      console.log('data', data);
    }

    return this._super(store, typeClass, data, id, requestType);
  },

  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    // const json = snapshot.record.toJSON();
    const json = this.serialize(snapshot);

    return preparePayload(json);
  }
});
