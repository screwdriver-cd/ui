import Model, { attr } from '@ember-data/model';

export default Model.extend({
  name: attr('string'),
  stageId: attr('number'),
  eventId: attr('number'),
  status: attr('string')
});
