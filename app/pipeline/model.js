import { get, computed, getWithDefault } from '@ember/object';
import classic from 'ember-classic-decorator';
import { alias } from '@ember/object/computed';
import Model, { attr, hasMany } from '@ember-data/model';

@classic
export default class _Model extends Model {
  @attr()
  admins;

  @attr()
  annotations;

  @attr('string')
  checkoutUrl;

  @attr('string')
  rootDir;

  @attr('boolean', { defaultValue: false })
  autoKeysGeneration;

  @attr('string')
  scmContext;

  @attr('date')
  createTime;

  @attr()
  scmRepo;

  @attr('string')
  scmUri;

  @attr('string')
  name;

  @attr()
  workflowGraph;

  @attr('string')
  configPipelineId;

  @attr()
  childPipelines;

  @attr('boolean', { defaultValue: false })
  prChain;

  @attr()
  parameters;

  @hasMany('job', { async: true })
  jobs;

  @hasMany('secret', { async: true })
  secrets;

  @hasMany('token', { async: true })
  tokens;

  @hasMany('metric', { async: true })
  metrics;

  @attr({
    defaultValue() {
      return {
        groupedEvents: true,
        showEventTriggers: false
      };
    }
  })
  settings;

  @alias('scmRepo.name')
  appId;

  @computed('scmRepo.{branch,rootDir}')
  get branch() {
    let { branch, rootDir } = this.scmRepo || {};

    if (rootDir) {
      branch = `${branch}:${rootDir}`;
    }

    return branch;
  }

  @alias('scmRepo.url')
  hubUrl;

  @computed('jobs.[]')
  get jobParameters() {
    const parameters = {};

    (this.jobs === undefined ? [] : this.jobs).forEach(job => {
      if (job.prParentJobId === null || job.prParentJobId === undefined) {
        const jobParameters = job.parameters;

        if (jobParameters) {
          parameters[job.name] = jobParameters;
        }
      }
    });

    return parameters;
  }
}
