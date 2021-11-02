import Component from '@ember/component';

export default Component.extend({
  tagName: '',

  actions: {
    authenticate(scmContext) {
      this.authenticate(scmContext);
    }
  }
});
