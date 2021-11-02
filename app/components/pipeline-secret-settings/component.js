import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { action, computed } from '@ember/object';
import { sort } from '@ember/object/computed';
import Component from '@ember/component';
import $ from 'jquery';

@tagName('')
@classic
export default class PipelineSecretSettings extends Component {
  newName = null;

  newValue = null;

  newAllow = false;

  errorMessage = '';

  secretsSorting = ['name'];

  @sort('secrets', 'secretsSorting')
  sortedSecrets;

  @computed('newName', 'newValue')
  get isButtonDisabled() {
    return !this.newName || !this.newValue;
  }

  /**
   * Kicks off create secret flow
   * @method addNewSecret
   */
  @action
  addNewSecret() {
    if (!/^[A-Z_][A-Z0-9_]*$/.test(this.newName)) {
      this.set(
        'errorMessage',
        'Secret keys can only consist of numbers, ' +
          'uppercase letters and underscores, and cannot begin with a number.'
      );

      return false;
    }

    this.onCreateSecret(
      this.newName,
      this.newValue,
      this.get('pipeline.id'),
      this.newAllow
    );
    this.set('newName', null);
    this.set('newValue', null);
    this.set('newAllow', false);

    return true;
  }

  /**
   * Toggle eye-icon and password input type
   * @method togglePasswordInput
   * @param {Object} event Click event
   */
  @action
  togglePasswordInput(event) {
    const { target } = event;
    const passwordInput = target.previousSibling;

    $(target).toggleClass('fa-eye fa-eye-slash');

    if ($(passwordInput).attr('type') === 'password') {
      $(passwordInput).attr('type', 'text');
    } else {
      $(passwordInput).attr('type', 'password');
    }
  }
}
