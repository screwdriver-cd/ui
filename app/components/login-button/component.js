import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    authenticate(context) {
      this.get('authenticate')(context);
    }
  }
});
