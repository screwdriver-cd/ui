import DS from 'ember-data';

/**
 * extractPayload
 * Make the raw payload into Ember Data expected format for RestAdapter
 * @param  {JSON} payload [raw json data]
 * @return {JSON}         [data]
 */
export function extractPayload(payload) {
  payload.forEach(stage => {
    stage.jobs = stage.jobIds;
    delete stage.jobIds;
  });

  const data = {
    stages: payload
  };

  return data;
}

export default DS.RESTSerializer.extend({
  normalizeResponse(store, typeClass, payload, id, requestType) {
    let data = payload;

    if (['query'].includes(requestType)) {
      data = extractPayload(payload);
    }

    return this._super(store, typeClass, data, id, requestType);
  },

  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  // eslint-disable-next-line no-unused-vars
  serializeIntoHash(hash, typeClass, snapshot) {
    return this._super(...arguments);
  }
});
