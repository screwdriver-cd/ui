import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    authenticate(scmContext) {
      this.get('authenticate')(scmContext);
    }
  }
});
