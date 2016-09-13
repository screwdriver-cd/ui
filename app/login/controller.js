import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),

  actions: {
    authenticate() {
      this.get('session').authenticate('authenticator:screwdriver-api');
    }
  }
});
