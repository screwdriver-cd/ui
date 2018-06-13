import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  newDescription: null,
  newName: null,
  tagName: 'tr',
  pipelineId: null,
  buttonAction: computed('token.{name,description}', 'newName', 'newDescription', {
    get() {
      const token = this.get('token');

      return (this.get('newName') !== token.get('name')
           || this.get('newDescription') !== token.get('description')) ?
        'Update' : 'Delete';
    }
  }),
  init() {
    this._super(...arguments);
    this.set('newName', this.get('token.name'));
    this.set('newDescription', this.get('token.description') || '');
  },
  actions: {
    modifyToken() {
      const token = this.get('token');

      if (this.get('buttonAction') === 'Delete') {
        this.get('confirmAction')('delete', this.get('token.id'));
      } else {
        token.set('name', this.get('newName'));
        token.set('description', this.get('newDescription'));
        this.get('setIsSaving')(true);

        token.save({ adapterOptions: { pipelineId: this.get('pipelineId') } })
          .then(() => {
            this.get('setIsSaving')(false);
          })
          .catch((error) => {
            this.get('setErrorMessage')(error.errors[0].detail);
          });
      }
    },
    refresh() {
      this.get('confirmAction')('refresh', this.get('token.id'));
    }
  }
});
