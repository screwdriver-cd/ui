import { alias } from '@ember/object/computed';
import DS from 'ember-data';

export default DS.Model.extend({
  admins: DS.attr(),
  annotations: DS.attr(),
  checkoutUrl: DS.attr('string'),
  scmContext: DS.attr('string'),
  createTime: DS.attr('date'),
  scmRepo: DS.attr(),
  scmUri: DS.attr('string'),
  name: DS.attr('string'),
  workflowGraph: DS.attr(),
  configPipelineId: DS.attr('string'),
  childPipelines: DS.attr(),

  jobs: DS.hasMany('job', { async: true }),
  secrets: DS.hasMany('secret', { async: true }),
  tokens: DS.hasMany('token', { async: true }),

  appId: alias('scmRepo.name'),
  branch: alias('scmRepo.branch'),
  hubUrl: alias('scmRepo.url')
});
