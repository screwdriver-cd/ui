import Ember from 'ember';

export default Ember.Component.extend({
  jobWidth: Ember.computed('jobs', {
    get() {
      const num = this.get('jobs').length;
      const width = Math.floor(100 / num);

      return Ember.String.htmlSafe(`width:${width}%`);
    }
  })
});
