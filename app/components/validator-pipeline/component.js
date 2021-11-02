import classic from 'ember-classic-decorator';
import { action } from '@ember/object';
import Component from '@ember/component';

@classic
export default class ValidatorPipeline extends Component {
  isOpen = false;

  didInsertElement() {
    super.didInsertElement(...arguments);
    if (!this.isOpen) {
      this.element
        .querySelectorAll('div')
        .forEach(el => el.classList.add('hidden'));
    }
  }

  @action
  nameClick() {
    this.toggleProperty('isOpen');
    this.element
      .querySelectorAll('div')
      .forEach(el => el.classList.toggle('hidden'));
  }
}
