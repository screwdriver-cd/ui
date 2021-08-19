import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  newDescription: null,
  newName: null,
  tagName: 'tr',
  pipelineId: null,
  buttonAction: computed(
    'token.{name,description}',
    'newName',
    'newDescription',
    {
      get() {
        const { token } = this;

        return this.newName !== token.get('name') ||
          this.newDescription !== token.get('description')
          ? 'Update'
          : 'Delete';
      }
    }
  ),
  init() {
    this._super(...arguments);
    this.set('newName', this.get('token.name'));
    this.set('newDescription', this.get('token.description') || '');
  },
  actions: {
    modifyToken(pipelineId) {
      const { token } = this;

      if (this.buttonAction === 'Delete') {
        this.confirmAction('delete', this.get('token.id'));
      } else {
        token.set('name', this.newName);
        token.set('description', this.newDescription);
        this.setIsSaving(true);

        if (pipelineId) {
          token
            .save({ adapterOptions: { pipelineId } })
            .then(() => {
              this.setIsSaving(false);
            })
            .catch(error => {
              this.setErrorMessage(error.errors[0].detail);
            });
        } else {
          token
            .save()
            .then(() => {
              this.setIsSaving(false);
            })
            .catch(error => {
              this.setErrorMessage(error.errors[0].detail);
            });
        }
      }
    },
    refresh() {
      this.confirmAction('refresh', this.get('token.id'));
    }
  }
});
