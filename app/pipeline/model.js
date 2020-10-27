import { alias } from '@ember/object/computed';
import { computed } from '@ember/object';
import DS from 'ember-data';

export default DS.Model.extend({
  admins: DS.attr(),
  annotations: DS.attr(),
  checkoutUrl: DS.attr('string'),
  rootDir: DS.attr('string'),
  autoKeysGeneration: DS.attr('boolean', { defaultValue: false }),
  scmContext: DS.attr('string'),
  createTime: DS.attr('date'),
  scmRepo: DS.attr(),
  scmUri: DS.attr('string'),
  name: DS.attr('string'),
  workflowGraph: DS.attr(),
  configPipelineId: DS.attr('string'),
  childPipelines: DS.attr(),
  prChain: DS.attr('boolean', { defaultValue: false }),
  parameters: DS.attr(),
  jobs: DS.hasMany('job', { async: true }),
  secrets: DS.hasMany('secret', { async: true }),
  tokens: DS.hasMany('token', { async: true }),
  metrics: DS.hasMany('metric', { async: true }),
  settings: DS.attr(),

  appId: alias('scmRepo.name'),
  branch: computed('scmRepo.{branch,rootDir}', {
    get() {
      let { branch, rootDir } = this.scmRepo || {};

      if (rootDir) {
        branch = `${branch}#${rootDir}`;
      }

      return branch;
    }
  }),
  hubUrl: alias('scmRepo.url')
});
