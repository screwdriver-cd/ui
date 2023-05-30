import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { jwt_decode as decoder } from 'ember-cli-jwt-decode';

export default Controller.extend({
  router: service(),
  errorMessage: '',
  session: service(),
  template: service(),
  templates: alias('model'),
  versionOrTagFromUrl: '',
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
    'templates.templateData.[]',
    'versionOrTagFromUrl',
    {
      get() {
        const version = this.get('latest.version');

        const { templateTagData } = this.templates;

        if (this.versionOrTagFromUrl === '') {
          return this.templates.templateData.findBy('version', version);
        }

        const tagExists = templateTagData.filter(
          t => t.tag === this.versionOrTagFromUrl
        );

        if (tagExists.length > 0) {
          return this.templates.templateData.findBy(
            'version',
            tagExists[0].version
          );
        }

        return this.templates.templateData.findBy(
          'version',
          this.versionOrTagFromUrl
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
