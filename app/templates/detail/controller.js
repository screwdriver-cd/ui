import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';
const { alias } = computed;

export default Controller.extend({
  selectedVersion: computed.oneWay('model.versionOrTagFromUrl'),
  errorMessage: '',
  session: service(),
  template: service(),
  templates: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  trusted: computed('templates.templateData.[]', function computeTrusted() {
    return this.templates.templateData.some(t => t.trusted);
  }),
  isAdmin: computed(function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  latest: computed('templates.templateData.[]', {
    get() {
      return this.templates.templateData[0];
    }
  }),
  versionTemplate: computed('selectedVersion', 'templates.templateData.[]', {
    get() {
      const version = this.selectedVersion || this.get('latest.version');

      let { versionOrTagFromUrl } = this.templates;
      let { templateTagData } = this.templates;

      if (versionOrTagFromUrl === undefined) {
        return this.templates.templateData.findBy('version', version);
      }

      let tagExists = templateTagData.filter(t => t.tag === versionOrTagFromUrl);

      if (tagExists.length > 0) {
        return this.templates.templateData.findBy('version', tagExists[0].version);
      }

      return this.templates.templateData.findBy('version', versionOrTagFromUrl);
    }
  }),
  actions: {
    removeTemplate(name) {
      return this.template
        .deleteTemplates(name)
        .then(() => this.transitionToRoute('templates'), err => this.set('errorMessage', err));
    },
    updateTrust(fullName, toTrust) {
      return (
        this.isAdmin &&
        this.template.updateTrust(fullName, toTrust).catch(err => this.set('errorMessage', err))
      );
    }
  }
});
