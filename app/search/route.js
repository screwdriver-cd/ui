import Ember from 'ember';

export default Ember.Route.extend({
  titleToken: 'Search',
  model() {
    return this.store.findAll('pipeline');
  }
});
