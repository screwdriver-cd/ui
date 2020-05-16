import DS from 'ember-data';
const { Model } = DS;

export default Model.extend({
  jobId: DS.attr('number'),
  builds: DS.attr()
});
