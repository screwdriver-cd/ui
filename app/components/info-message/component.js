import Component from '@ember/component';

export default Component.extend({
  type: 'info',
  dismissible: true,
  actions: {
    clearMessage: function clearMessage() {
      this.set('message', null);
    },
    authenticate(scmContext) {
      this.session.authenticate('authenticator:screwdriver-api', scmContext);
      this.set('message', null);
    }
  }
});
