import RESTSerializer from '@ember-data/serializer/rest';

export default RESTSerializer.extend({
  /**
   * Override the serializeIntoHash
   * See http://emberjs.com/api/data/classes/DS.RESTSerializer.html#method_serializeIntoHash
   * @method serializeIntoHash
   */
  serializeIntoHash(hash, typeClass, snapshot) {
    const json = this.serialize(snapshot, { includeId: true });
    const { id, showPRJobs } = json;
    const pipelinePreference = { showPRJobs };

    return { id, pipelinePreference };
  }
});
