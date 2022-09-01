import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  // normalizeQueryRecordResponse(store, typeClass, payload, id, requestType) {
  //   if (requestType === 'queryRecord') {
  //     // payload.collection.pipelines.forEach(p => {
  //     //   p.links = {
  //     //     metrics: `/v4/pipelines/${p.id}/metrics?count=20&page=1`
  //     //   };
  //     // });
  //     console.log('payload here', payload);
  //   }

  //   console.log('payload', payload);

  //   // const { desiredJobNameLength, displayJobNameLength } = payload;
  //   // delete payload.desiredJobNameLength;
  //   // delete payload.displayJobNameLength;

  //   // const data = {
  //   //   'preference/user': {
  //   //     id: 1,
  //   //     desiredJobNameLength,
  //   //     'preference/pipelines': payload
  //   //   }
  //   // }

  //   return this._super(store, typeClass, payload, id, requestType);
  // }

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

  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    console.log('herere serializeIntoHash');

    const json = this.serialize(snapshot, { includeId: true });
    const { id, showPRJobs } = json;
    const pipelinePreference = { showPRJobs };

    return {id, pipelinePreference};
  }
});
