import Component from '@ember/component';

export default Component.extend({
  actions: {
    startBuild() {
      const prNum = this.get('prNum');
      const startFunc = this.get('startBuild');

      startFunc.apply(null, prNum ? [prNum] : []);
    }
  }
});
