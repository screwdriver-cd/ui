import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['row'],
  scmService: Ember.inject.service('scm'),
  scmContext: Ember.computed({
    get() {
      const pipeline = this.get('pipeline');
      const scm = this.get('scmService').getScm(pipeline.get('scmContext'));

      return {
        scm: scm.displayName,
        scmIcon: scm.iconType
      };
    }
  })
});
