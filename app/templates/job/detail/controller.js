import { alias } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import Controller from '@ember/controller';
import { jwtDecode } from 'jwt-decode';
import { all } from 'rsvp';

export default Controller.extend({
  store: service(),
  router: service(),
  errorMessage: '',
  session: service(),
  template: service(),
  versionOrTagFromUrl: '',
  reset() {
    this.set('errorMessage', '');
  },
  templates: alias('model.templateData'),
  templateTags: alias('model.templateTagData'),
  filteredTemplates: alias('model.templateDataFiltered'),
  startTime: alias('model.filter.startTime'),
  endTime: alias('model.filter.endTime'),
  selectedRange: alias('model.filter.selectedRange'),
  trusted: computed('templates.[]', function computeTrusted() {
    return this.get('templates').some(t => t.trusted && t.latest);
  }),
  isAdmin: computed('session.data.authenticated.token', function isAdmin() {
    const token = this.get('session.data.authenticated.token');

    return (jwtDecode(token).scope || []).includes('admin');
  }),
  latest: computed('templates.[]', {
    get() {
      return this.get('templates')[0];
    }
  }),
  selectedVersionTemplate: computed(
    'latest.version',
    'templates.[]',
    'templateTags.[]',
    'versionOrTagFromUrl',
    {
      get() {
        const version = this.get('latest.version');

        const templateData = this.get('templates');
        const templateTagData = this.get('templateTags');

        if (this.versionOrTagFromUrl === '') {
          return templateData.findBy('version', version);
        }

        const tagExists = templateTagData.filter(
          t => t.tag === this.versionOrTagFromUrl
        );

        if (tagExists.length > 0) {
          return templateData.findBy('version', tagExists[0].version);
        }

        return templateData.findBy('version', this.versionOrTagFromUrl);
      }
    }
  ),
  pipelinesUsingSelectedTemplate: computed(
    'selectedVersionTemplate.metrics.pipelines.ids',
    {
      async get() {
        const pipelineIds = this.selectedVersionTemplate.metrics.pipelines.ids;

        // return pipelineIds;
        const pipelines = await all(
          pipelineIds.map(p => this.store.findRecord('pipeline', p))
        );

        return pipelines;
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
    removeVersion(fullName, versionToDelete) {
      return this.template
        .deleteVersion(fullName, versionToDelete)
        .then(() => {
          this.send('refreshModel');
        })
        .catch(err => this.set('errorMessage', err));
    },
    updateTrust(fullName, toTrust) {
      return (
        this.isAdmin &&
        this.template
          .updateTrust(fullName, toTrust)
          .catch(err => this.set('errorMessage', err))
      );
    },
    timeRangeChange(startTime, endTime, selectedRange = null) {
      // send to router to refresh model accordingly
      this.send('setFetchDates', startTime, endTime, selectedRange);
    }
  }
});
