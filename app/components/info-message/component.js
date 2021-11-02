import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class InfoMessage extends Component {
  type = 'info';

  @action
  clearMessage() {
    this.set('message', null);
  }

  @action
  authenticate(scmContext) {
    this.session.authenticate('authenticator:screwdriver-api', scmContext);
    this.set('message', null);
  }
}
