import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  refreshService: service('user-settings'),
  newToken: null,
  tokens: alias('model'),
  actions: {
    createToken(name, description) {
      const newToken = this.store.createRecord('token', {
        name,
        description: description || '',
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
      return this.refreshService.refreshToken(id)
        .then((token) => {
          this.set('newToken', token);
        });
    }
  }
});
