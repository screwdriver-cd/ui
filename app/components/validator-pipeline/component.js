import Ember from 'ember';

export default Ember.Component.extend({
  isOpen: true,
  actions: {
    nameClick() {
      this.toggleProperty('isOpen');
      this.$('div').toggle('hidden');
    }
  }
});
