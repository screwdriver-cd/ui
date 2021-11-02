import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

@tagName('')
@classic
export default class QuickstartGuide extends Component {
  isOpen = false;

  @action
  closeMenu() {
    this.set('isOpen', false);
  }

  @action
  openMenu() {
    this.set('isOpen', true);
  }
}
