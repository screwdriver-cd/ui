import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),
  actions: {
    authenticate(context) {
      this.get('session').authenticate('authenticator:screwdriver-api', context);
    }
  }
});
