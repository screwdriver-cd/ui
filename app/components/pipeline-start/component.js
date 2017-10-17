import Component from '@ember/component';

export default Component.extend({
  actions: {
    startBuild() {
      this.get('startBuild')();
    }
  }
});
