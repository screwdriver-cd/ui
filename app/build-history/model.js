import Model, { attr } from '@ember-data/model';

export default Model.extend({
  jobId: attr('number'),
  builds: attr()
});
