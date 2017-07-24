import Ember from 'ember';

export default Ember.Controller.extend({
  actions: {
    createCollection(name, description) {
      const newCollection = this.store.createRecord('collection', {
        name,
        description
      });

      return newCollection.save()
        .then((collection) => {
          this.set('newCollection', collection);
        })
        .catch((error) => {
          newCollection.destroyRecord();
          throw error;
        });
    }
  }
});
