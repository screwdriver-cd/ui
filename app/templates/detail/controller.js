import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  templates: alias('model'),
  latest: computed('templates.[]', {
    get() {
      return this.get('templates')[0];
    }
  }),
  template: computed('selectedVersion', 'templates.[]', {
    get() {
      const version = this.get('selectedVersion') || this.get('latest.version');

      return this.get('templates').findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of templates changes
  modelObserver: observer('templates.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    }
  }
});
