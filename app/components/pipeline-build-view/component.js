import Ember from 'ember';

export default Ember.Component.extend({
  truncatedSha: Ember.computed('commit', {
    get() {
      return this.get('commit.sha').substr(0, 6);
    }
  }),
  commit: Ember.computed('workflow.0.build', {
    get() {
      return this.get('workflow.0.build');
    }
  })
});
