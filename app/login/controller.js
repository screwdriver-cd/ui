import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';

@classic
export default class LoginController extends Controller {
  @service
  router;

  @service('session')
  session;

  @alias('model.scms')
  scmContexts;

  @action
  authenticate(scmContext) {
    this.session.authenticate('authenticator:screwdriver-api', scmContext);
  }
}
