import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  namespace: 'v3',
  host: 'http://api.screwdriver.cd'
});
