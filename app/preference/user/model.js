// import Model from '@ember-data/model';

// export default class PreferenceUserModel extends Model {

// }

import DS from 'ember-data';

export default DS.Model.extend({
  displayJobNameLength: DS.attr('string'),
  'preference/pipelines': DS.hasMany('preference/pipeline', { sync: true })
});
