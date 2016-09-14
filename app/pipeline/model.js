import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  scmUrl: DS.attr('string'),
  configUrl: DS.attr('string', { defaultValue: '' }),
  createTime: DS.attr('date'),
  admins: DS.attr(),
  secrets: DS.hasMany('secret', { async: true }),
  jobs: DS.hasMany('job', { async: true }),
  repoData: Ember.computed('scmUrl', {
    get() {
      const http = /^http[s]?:\/\/([^/]+)\/([^/]+)\/([^/]+)\.git#?(.*)?/;
      const git = /^git@([^:]+):([^/]+)\/([^/]+)\.git#?(.*)?/;
      const scmUrl = this.get('scmUrl');
      const matches = /^git@/.test(scmUrl) ? scmUrl.match(git) : scmUrl.match(http);
      let host;
      let owner;
      let repo;
      let branch;

      if (matches) {
        host = matches[1];
        owner = matches[2];
        repo = matches[3];
        branch = matches[4] || 'master';
      }

      return { host, owner, repo, branch };
    }
  }),
  appId: Ember.computed('repoData', {
    get() {
      const data = this.get('repoData');

      return `${data.owner}:${data.repo}`;
    }
  }),
  hubUrl: Ember.computed('repoData', {
    get() {
      const data = this.get('repoData');

      return `https://${data.host}/${data.owner}/${data.repo}`;
    }
  })
});
