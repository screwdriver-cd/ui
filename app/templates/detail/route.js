import Ember from 'ember';

export default Ember.Route.extend({
  template: Ember.inject.service(),
  model(params) {
    return this.get('template').getOneTemplate(params.name);
  }
});
