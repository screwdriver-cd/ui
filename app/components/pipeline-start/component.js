import Ember from 'ember';

export default Ember.Component.extend({
  actions: {
    startBuild() {
      this.get('startBuild')();
    }
  }
});
