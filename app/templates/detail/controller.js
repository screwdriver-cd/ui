import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  template: service(),
  templates: alias('model'),
  reset: function() {
    this.set('errorMessage', '');
  },
  latest: computed('templates.[]', {
    get() {
      return this.get('templates')[0];
    }
  }),
  versionTemplate: computed('selectedVersion', 'templates.[]', {
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
    },
    removeTemplate(name) {
      return this.get('template').deleteTemplates(name)
        .then(
          () => this.transitionToRoute('templates'),
          (err) => this.set('errorMessage', err));
    }
  }
});
