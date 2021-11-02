import { tagName } from '@ember-decorators/component';
import classic from 'ember-classic-decorator';
import { observes } from '@ember-decorators/object';
import { action, computed } from '@ember/object';
import { sort } from '@ember/object/computed';
import { capitalize } from '@ember/string';
import Component from '@ember/component';

@tagName('')
@classic
export default class TokenList extends Component {
  tokenSorting = ['name', 'description', 'lastUsed'];

  // Error for failed to create/update/remove/refresh token
  errorMessage = null;

  // Adding a new token
  isSaving = false;

  newDescription = null;

  newName = null;

  // Confirmation dialog
  isShowingModal = false;

  modalAction = null;

  modalTarget = null;

  modalText = null;

  @sort('tokens', 'tokenSorting')
  sortedTokens;

  @computed('newName', 'isSaving')
  get isButtonDisabled() {
    return !this.newName || this.isSaving;
  }

  @computed('modalAction')
  get modalButtonText() {
    return capitalize(this.modalAction);
  }

  // Don't show the "new token" and "error" dialogs at the same time
  // eslint-disable-next-line ember/no-observers
  @observes('errorMessage')
  errorObserver() {
    if (this.errorMessage) {
      this.set('newToken', null);
      this.set('isSaving', null);
    }
  }

  // eslint-disable-next-line ember/no-observers
  @observes('newToken')
  newTokenObserver() {
    if (this.newToken) {
      this.set('errorMessage', null);
      this.set('isSaving', null);
    }
  }

  willClearRender() {
    super.willClearRender(...arguments);
    this.set('newToken', null);
  }

  /**
   * Kicks off create token flow
   * @method addNewToken
   */
  @action
  addNewToken() {
    this.set('isSaving', true);

    return this.onCreateToken(this.newName, this.newDescription)
      .then(() => {
        this.set('newName', null);
        this.set('newDescription', null);
      })
      .catch(error => {
        this.set('errorMessage', error.errors[0].detail);
      });
  }

  /**
   * Clear the new token
   * @method clearNewToken
   */
  @action
  clearNewToken() {
    this.set('newToken', null);
  }

  /**
   * Set the error to be displayed from child components
   * @param {String} errorMessage
   */
  @action
  setErrorMessage(errorMessage) {
    this.set('errorMessage', errorMessage);
  }

  /**
   * Show or hide the saving modal from child components
   * @param {Boolean} isSaving
   */
  @action
  setIsSaving(isSaving) {
    this.set('isSaving', isSaving);
  }

  /**
   * Confirm an action
   * @method confirmAction
   * @param {String} action   One of "refresh" or "revoke"
   * @param {Number} id
   */
  @action
  confirmAction(action, id) {
    this.set(
      'modalTarget',
      this.tokens.find(token => token.get('id') === id)
    );
    this.set('modalAction', action);

    if (action === 'delete') {
      this.set(
        'modalText',
        `The "${this.get('modalTarget.name')}" token will be deleted.`
      );
    } else {
      this.set(
        'modalText',
        `The current "${this.get(
          'modalTarget.name'
        )}" token will be invalidated.`
      );
    }

    this.set('isShowingModal', true);
  }

  /**
   * Close the modal, calling a callback if necessary
   * @method closeModal
   * @param {Boolean} confirm
   */
  @action
  closeModal(confirm) {
    this.set('isShowingModal', false);

    if (confirm) {
      if (this.modalAction === 'delete') {
        this.modalTarget.destroyRecord({
          adapterOptions: { pipelineId: this.pipelineId }
        });
      } else {
        this.set('isSaving', true);
        this.onRefreshToken(this.get('modalTarget.id')).catch(error => {
          this.set('errorMessage', error.errors[0].detail);
        });
      }
    }
  }
}
