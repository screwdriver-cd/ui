import Ember from 'ember';

export default Ember.Component.extend({
  tokenSorting: ['name', 'description', 'lastUsed'],
  sortedTokens: Ember.computed.sort('tokens', 'tokenSorting'),

  // Error for failed to create/update/remove/refresh token
  error: null,
  errorMessage: Ember.computed('error', function errorMessage() {
    const error = this.get('error');

    return error ? error.errors[0].detail : '';
  }),

  // Adding a new token
  isButtonDisabled: Ember.computed('newName', 'isSaving', function isButtonDisabled() {
    return !this.get('newName') || this.get('isSaving');
  }),
  isSaving: false,
  newDescription: null,
  newName: null,

  // Confirmation dialog
  isShowingModal: false,
  modalAction: null,
  modalButtonText: Ember.computed('modalAction', function modalButtonText() {
    return Ember.String.capitalize(this.get('modalAction'));
  }),
  modalTarget: null,
  modalText: null,
  modalTitle: Ember.computed('newToken', function modalTitle() {
    return this.get('newToken') ? `Token ${this.get('newToken.action')}!` : 'Are you sure?';
  }),

  // Show the modal if there's a new token
  newTokenObserver: Ember.observer('newToken', function newTokenObserver() {
    if (this.get('newToken')) {
      this.set('error', null);
      this.set('isSaving', false);
      this.set('modalAction', 'dismiss');
      this.set('isShowingModal', true);
    }
  }),

  actions: {
    /**
     * Kicks off create token flow
     * @method addNewToken
     */
    addNewToken() {
      const newName = this.get('newName');

      this.set('isSaving', true);

      return this.get('onCreateToken')(newName, this.get('newDescription'))
        .then(() => {
          this.set('newName', null);
          this.set('newDescription', null);
        }).catch((error) => {
          this.set('error', error);
        });
    },
    /**
     * Set the error to be displayed from child components
     * @param {Object} error
     */
    setError(error) {
      this.set('error', error);
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
     * @param {String} action   One of "refresh" or "delete"
     * @param {Number} id
     */
    confirmAction(action, id) {
      this.set('modalTarget', this.get('tokens').find(token => token.get('id') === id));
      this.set('modalAction', action);

      if (action === 'delete') {
        this.set('modalText', `The "${this.get('modalTarget.name')}" token will be deleted.`);
      } else {
        this.set('modalText',
          `The current "${this.get('modalTarget.name')}" token will be invalidated.`);
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
      this.set('newToken', null);

      if (confirm) {
        const modalAction = this.get('modalAction');

        if (modalAction === 'delete') {
          this.get('modalTarget').destroyRecord();
        } else if (modalAction === 'refresh') {
          this.set('isSaving', true);
          this.get('onRefreshToken')(this.get('modalTarget.id'))
            .catch((error) => {
              this.set('error', error);
            });
        }
      }
    }
  }
});
