import Ember from 'ember';

export default Ember.Component.extend({
  truncatedSha: Ember.computed('build.sha', {
    get() {
      return this.get('build.sha').substr(0, 6);
    }
  }),
  jobName: Ember.computed('build.jobId', {
    get() {
      return this.get('jobs').filter(j => j.get('id') === this.get('build.jobId'))[0].get('name');
    }
  })
});
