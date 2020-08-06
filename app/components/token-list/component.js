import { capitalize } from '@ember/string';
import { computed, observer } from '@ember/object';
import { sort } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  tokenSorting: ['name', 'description', 'lastUsed'],

  // Error for failed to create/update/remove/refresh token
  errorMessage: null,

  // Adding a new token
  isSaving: false,
  newDescription: null,
  newName: null,

  // Confirmation dialog
  isShowingModal: false,
  modalAction: null,
  modalTarget: null,
  modalText: null,

  sortedTokens: sort('tokens', 'tokenSorting'),

  isButtonDisabled: computed('newName', 'isSaving', function isButtonDisabled() {
    return !this.newName || this.isSaving;
  }),

  modalButtonText: computed('modalAction', function modalButtonText() {
    return capitalize(this.modalAction);
  }),

  // Don't show the "new token" and "error" dialogs at the same time
  // eslint-disable-next-line ember/no-observers
  errorObserver: observer('errorMessage', function errorObserver() {
    if (this.errorMessage) {
      this.set('newToken', null);
      this.set('isSaving', null);
    }
  }),
  // eslint-disable-next-line ember/no-observers
  newTokenObserver: observer('newToken', function newTokenObserver() {
    if (this.newToken) {
      this.set('errorMessage', null);
      this.set('isSaving', null);
    }
  }),
  willClearRender() {
    this._super(...arguments);
    this.set('newToken', null);
  },

  actions: {
    /**
     * Kicks off create token flow
     * @method addNewToken
     */
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
    },
    /**
     * Clear the new token
     * @method clearNewToken
     */
    clearNewToken() {
      this.set('newToken', null);
    },
    /**
     * Set the error to be displayed from child components
     * @param {String} errorMessage
     */
    setErrorMessage(errorMessage) {
      this.set('errorMessage', errorMessage);
    },
    /**
     * Show or hide the saving modal from child components
     * @param {Boolean} isSaving
     */
    setIsSaving(isSaving) {
      this.set('isSaving', isSaving);
    },
    /**
     * Confirm an action
     * @method confirmAction
     * @param {String} action   One of "refresh" or "revoke"
     * @param {Number} id
     */
    confirmAction(action, id) {
      this.set('modalTarget', this.tokens.find(token => token.get('id') === id));
      this.set('modalAction', action);

      if (action === 'delete') {
        this.set('modalText', `The "${this.get('modalTarget.name')}" token will be deleted.`);
      } else {
        this.set(
          'modalText',
          `The current "${this.get('modalTarget.name')}" token will be invalidated.`
        );
      }

      this.set('isShowingModal', true);
    },
    /**
     * Close the modal, calling a callback if necessary
     * @method closeModal
     * @param {Boolean} confirm
     */
    closeModal(confirm) {
      this.set('isShowingModal', false);

      if (confirm) {
        if (this.modalAction === 'delete') {
          this.modalTarget.destroyRecord({ adapterOptions: { pipelineId: this.pipelineId } });
        } else {
          this.set('isSaving', true);
          this.onRefreshToken(this.get('modalTarget.id')).catch(error => {
            this.set('errorMessage', error.errors[0].detail);
          });
        }
      }
    }
  }
});
