import RESTSerializer from '@ember-data/serializer/rest';

export default RESTSerializer.extend({
  primaryKey: 'jobId',

  modelNameFromPayloadKey(/* key */) {
    return 'build-history';
  }
});
