import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

@classic
export default class ValidatorInput extends Component {
  isOpen = true;

  @action
  nameClick() {
    this.toggleProperty('isOpen');
    this.element
      .querySelector('#validator-ace-editor')
      .classList.toggle('hidden');
  }
}
