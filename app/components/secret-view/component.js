import classic from 'ember-classic-decorator';
import { tagName } from '@ember-decorators/component';
import { action, computed } from '@ember/object';
import Component from '@ember/component';
import $ from 'jquery';

@classic
@tagName('')
export default class SecretView extends Component {
  newValue = null;

  originalAllowInPR = null;

  @computed('newValue', 'secret.allowInPR', 'originalAllowInPR')
  get buttonAction() {
    const { secret, pipeline } = this;

    if (pipeline.get('configPipelineId')) {
      if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
        return 'Override';
      }

      return this.newValue ||
        this.originalAllowInPR !== this.get('secret.allowInPR')
        ? 'Update'
        : 'Revert';
    }

    return this.newValue ||
      this.originalAllowInPR !== this.get('secret.allowInPR')
      ? 'Update'
      : 'Delete';
  }

  @computed
  get passwordPlaceholder() {
    const { secret, pipeline } = this;

    if (secret.get('pipelineId') === pipeline.get('configPipelineId')) {
      return 'Inherited from parent pipeline';
    }

    return 'Protected';
  }

  init() {
    super.init(...arguments);
    this.set('originalAllowInPR', this.get('secret.allowInPR'));
  }

  @action
  modifySecret() {
    const { secret } = this;

    if (this.buttonAction === 'Delete' || this.buttonAction === 'Revert') {
      this.set('secretToRemove', true);

      return Promise.resolve(null);
    }
    if (this.buttonAction === 'Update') {
      if (this.newValue) {
        secret.set('value', this.newValue);
      }
      secret.save();
      this.set('newValue', null);
      this.set('originalAllowInPR', secret.get('allowInPR'));
    } else if (this.newValue) {
      // Create child pipeline secret to override inherited secret of same name
      return this.onCreateSecret(
        secret.get('name'),
        this.newValue,
        this.get('pipeline.id'),
        secret.get('allowInPR')
      );
    }

    return Promise.resolve(null);
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

  @action
  removeSecret() {
    const { secret } = this;

    return secret.destroyRecord().then(() => {
      this.secrets.store.unloadRecord(secret);
      this.secrets.reload();
    });
  }

  @action
  cancelRemovingSecret() {
    this.set('secretToRemove', null);
    this.set('isRemoving', false);
  }
}
