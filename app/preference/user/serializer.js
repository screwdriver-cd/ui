import RESTSerializer, {
  EmbeddedRecordsMixin
} from '@ember-data/serializer/rest';

/**
 * extractPayload
 * Make the raw payload into Ember Data expected format for RestAdapater
 * @param  {JSON} payload [raw json data]
 * @return {JSON}         [data]
 */
export function extractPayload(payload) {
  const { displayJobNameLength, timestampFormat, allowNotification } = payload;

  delete payload.displayJobNameLength;
  delete payload.timestampFormat;

  const preferencePipelines = Object.keys(payload)
    .map(id => {
      const parsed = parseInt(id, 10);

      if (Number.isInteger(parsed)) {
        return { id, ...payload[id] };
      }

      return null;
    })
    .filter(_ => _);

  const data = {
    'preference/user': {
      id: 1,
      displayJobNameLength,
      timestampFormat,
      allowNotification,
      'preference/pipelines': preferencePipelines
    }
  };

  return data;
}

/**
 * preparePayload
 * The reverse operation of extractPayload
 * This method helps prepare ember data into format that backend expects
 * @param  {[JSON]} preferenceUser [data]
 * @return {[JSON]}                [raw data]
 */
export function preparePayload(preferenceUser) {
  const { displayJobNameLength, timestampFormat, allowNotification } =
    preferenceUser;
  const data = {
    displayJobNameLength,
    timestampFormat,
    allowNotification
  };
  const preferencePipelines = preferenceUser['preference/pipelines'] ?? [];

  preferencePipelines.forEach(({ id, showPRJobs }) => {
    data[id] = {
      showPRJobs
    };
  });

  return data;
}

export default RESTSerializer.extend(EmbeddedRecordsMixin, {
  attrs: {
    'preference/pipelines': { embedded: 'always' }
  },

  normalizeResponse(store, typeClass, payload, id, requestType) {
    let data = payload;

    if (['queryRecord', 'updateRecord'].includes(requestType)) {
      data = extractPayload(payload);
    }

    return this._super(store, typeClass, data, id, requestType);
  },

  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const json = this.serialize(snapshot);

    return preparePayload(json);
  }
});
