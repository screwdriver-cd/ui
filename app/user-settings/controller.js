import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class UserSettingsController extends Controller {
  @service('user-settings')
  refreshService;

  newToken = null;

  @alias('model')
  tokens;

  @action
  createToken(name, description) {
    const newToken = this.store.createRecord('token', {
      name,
      description: description || '',
      action: 'created'
    });

    return newToken
      .save()
      .then(token => {
        this.set('newToken', token);
      })
      .catch(error => {
        newToken.destroyRecord();
        throw error;
      });
  }

  @action
  refreshToken(id) {
    return this.refreshService.refreshToken(id).then(token => {
      this.set('newToken', token);
    });
  }
}
