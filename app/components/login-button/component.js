import Component from '@ember/component';

export default Component.extend({
  actions: {
    authenticate(scmContext) {
      this.get('authenticate')(scmContext);
    }
  }
});
