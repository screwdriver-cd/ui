import Ember from 'ember';

export default Ember.Controller.extend({
  selectedVersion: null,
  latest: Ember.computed('model.[]', {
    get() {
      return this.get('model')[0];
    }
  }),
  // Set selected version to null whenever the list of templates changes
  modelObserver: Ember.observer('model.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  template: Ember.computed('selectedVersion', 'model.[]', {
    get() {
      const version = this.get('selectedVersion') || this.get('latest.version');

      return this.get('model').findBy('version', version);
    }
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    }
  }
});
