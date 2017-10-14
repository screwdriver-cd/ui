import Route from '@ember/routing/route';

export default Route.extend({
  model({ collection_id }) {
    return this.get('store').findRecord('collection', collection_id);
  }
});
