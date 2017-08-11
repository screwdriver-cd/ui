import Ember from 'ember';

export default Ember.Route.extend({
  model({ collection_id }) {
    return this.get('store').findRecord('collection', collection_id);
  }
});
