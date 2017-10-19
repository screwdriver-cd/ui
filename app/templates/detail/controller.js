import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';

export default Controller.extend({
  selectedVersion: null,
  latest: computed('model.[]', {
    get() {
      return this.get('model')[0];
    }
  }),
  template: computed('selectedVersion', 'model.[]', {
    get() {
      const version = this.get('selectedVersion') || this.get('latest.version');

      return this.get('model').findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of templates changes
  modelObserver: observer('model.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    }
  }
});
