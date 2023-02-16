import { oneWay, alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

export default Controller.extend({
  router: service(),
  selectedVersion: oneWay('model.versionOrTagFromUrl'),
  errorMessage: '',
  session: service(),
  template: service(),
  templates: alias('model'),
  reset() {
    this.set('errorMessage', '');
  },
  trusted: computed('templates.templateData.[]', function computeTrusted() {
    return this.templates.templateData.some(t => t.trusted && t.latest);
  }),
  isAdmin: computed('session.data.authenticated.token', function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (decoder(token).scope || []).includes('admin');
  }),
  latest: computed('templates.templateData.[]', {
    get() {
      return this.templates.templateData[0];
    }
  }),
  versionTemplate: computed(
    'latest.version',
    'selectedVersion',
    'templates.templateData.[]',
    {
      get() {
        const version = this.selectedVersion || this.get('latest.version');

        const { versionOrTagFromUrl, templateTagData } = this.templates;

        if (versionOrTagFromUrl === undefined) {
          return this.templates.templateData.findBy('version', version);
        }

        const tagExists = templateTagData.filter(
          t => t.tag === versionOrTagFromUrl
        );

        if (tagExists.length > 0) {
          return this.templates.templateData.findBy(
            'version',
            tagExists[0].version
          );
        }

        return this.templates.templateData.findBy(
          'version',
          versionOrTagFromUrl
        );
      }
    }
  ),
  actions: {
    removeTemplate(name) {
      return this.template.deleteTemplates(name).then(
        () => this.router.transitionTo('templates'),
        err => this.set('errorMessage', err)
      );
    },
    updateTrust(fullName, toTrust) {
      return (
        this.isAdmin &&
        this.template
          .updateTrust(fullName, toTrust)
          .catch(err => this.set('errorMessage', err))
      );
    }
  }
});
