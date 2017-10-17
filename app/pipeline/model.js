import { alias } from '@ember/object/computed';
import DS from 'ember-data';

export default DS.Model.extend({
  admins: DS.attr(),
  appId: alias('scmRepo.name'),
  branch: alias('scmRepo.branch'),
  checkoutUrl: DS.attr('string'),
  scmContext: DS.attr('string'),
  createTime: DS.attr('date'),
  events: DS.hasMany('event', { async: true }),
  hubUrl: alias('scmRepo.url'),
  jobs: DS.hasMany('job', { async: true }),
  scmRepo: DS.attr(),
  scmUri: DS.attr('string'),
  secrets: DS.hasMany('secret', { async: true })
});
