import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'tr',
  buttonAction: Ember.computed('newName', 'newDescription', function buttonAction() {
    const token = this.get('token');

    return (this.get('newName') !== token.get('name')
         || this.get('newDescription') !== token.get('description')) ?
      'Update' : 'Delete';
  }),
  newName: null,
  newDescription: null,
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

        token.save()
          .then(() => {
            this.set('buttonAction', 'Delete');
            this.get('setIsSaving')(false);
          })
          .catch((error) => {
            this.get('setError')(error);
          });
      }
    },
    refresh() {
      this.get('confirmAction')('refresh', this.get('token.id'));
    }
  }
});
