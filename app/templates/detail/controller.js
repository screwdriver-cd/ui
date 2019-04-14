import { inject as service } from '@ember/service';
import { computed, observer } from '@ember/object';
import Controller from '@ember/controller';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: null,
  errorMessage: '',
  template: service(),
  templates: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  latest: computed('templates.[]', {
    get() {
      return this.templates[0];
    }
  }),
  versionTemplate: computed('selectedVersion', 'templates.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      return this.templates.findBy('version', version);
    }
  }),
  // Set selected version to null whenever the list of templates changes
  // eslint-disable-next-line ember/no-observers
  modelObserver: observer('templates.[]', function modelObserver() {
    this.set('selectedVersion', null);
  }),
  actions: {
    changeVersion(version) {
      this.set('selectedVersion', version);
    },
    removeTemplate(name) {
      return this.template
        .deleteTemplates(name)
        .then(() => this.transitionToRoute('templates'), err => this.set('errorMessage', err));
    }
  }
});
