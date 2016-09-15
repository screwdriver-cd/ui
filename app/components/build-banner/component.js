import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['build-banner'],
  classNameBindings: ['build.status'],

  truncatedSha: Ember.computed('build.sha', {
    get() {
      return this.get('build.sha').substr(0, 6);
    }
  })
});
