import Ember from 'ember';

export default Ember.Controller.extend({
  refreshService: Ember.inject.service('user-settings'),
  newToken: null,
  actions: {
    createToken(name, description) {
      const newToken = this.store.createRecord('token', {
        name,
        description,
        action: 'created'
      });

      return newToken.save()
        .then((token) => {
          this.set('newToken', token);
        })
        .catch((error) => {
          newToken.destroyRecord();
          throw error;
        });
    },
    refreshToken(id) {
      return this.get('refreshService').refreshToken(id)
        .then((token) => {
          this.set('newToken', token);
        });
    }
  }
});
