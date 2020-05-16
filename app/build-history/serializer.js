import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  primaryKey: 'jobId',

  modelNameFromPayloadKey(/* key */) {
    return 'build-history';
  }
});
