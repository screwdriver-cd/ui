import Ember from 'ember';

export default Ember.Controller.extend({
  session: Ember.inject.service('session'),
  actions: {
    authenticate(scmContext) {
      this.get('session').authenticate('authenticator:screwdriver-api', scmContext);
    }
  }
});
