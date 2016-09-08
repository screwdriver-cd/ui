import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-details'],
  /**
   * Truncates build sha.
   * @property {String} truncatedSha
   */
  truncatedSha: Ember.computed('build.sha', {
    get() {
      return (this.get('build.sha') || '').substr(0, 6);
    }
  }),

  /**
   * Returns docker href for build container.
   * @property {String} containerHref
   */
  containerHref: Ember.computed('build.buildContainer', {
    get() {
      const container = this.get('build.buildContainer');
      let root = 'node';

      if (container) {
        root = container.match(/^[^:]+/)[0];
      }

      return `https://hub.docker.com/_/${root}/`;
    }
  })
});
