import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  scmUrl: DS.attr('string'),
  configUrl: DS.attr('string', { defaultValue: '' }),
  scmUri: DS.attr('string'),
  createTime: DS.attr('date'),
  admins: DS.attr(),
  secrets: DS.hasMany('secret', { async: true }),
  jobs: DS.hasMany('job', { async: true }),
  scmRepo: DS.attr(),
  scmRepoObject: Ember.computed('scmRepo', {
    get() {
      return Ember.Object.create(this.get('scmRepo'));
    }
  }),
  appId: Ember.computed('scmRepoObject', {
    get() {
      return this.get('scmRepoObject').name;
    }
  }),
  hubUrl: Ember.computed('scmRepoObject', {
    get() {
      return this.get('scmRepoObject').url;
    }
  }),
  branch: Ember.computed('scmRepoObject', {
    get() {
      return this.get('scmRepoObject').branch;
    }
  })
});
