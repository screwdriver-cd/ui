import { computed } from '@ember/object';
import Model, { attr, hasMany } from '@ember-data/model';
import { alias } from '@ember/object/computed';
import { formatMetrics } from 'screwdriver-ui/utils/metric';

export default Model.extend({
  admins: attr(),
  annotations: attr(),
  checkoutUrl: attr('string'),
  rootDir: attr('string'),
  autoKeysGeneration: attr('boolean', { defaultValue: false }),
  scmContext: attr('string'),
  createTime: attr('date'),
  scmRepo: attr(),
  scmUri: attr('string'),
  name: attr('string'),
  state: attr('string'),
  workflowGraph: attr(),
  configPipelineId: attr('string'),
  childPipelines: attr(),
  prChain: attr('boolean', { defaultValue: false }),
  parameters: attr(),
  jobs: hasMany('job', { async: true }),
  secrets: hasMany('secret', { async: true }),
  tokens: hasMany('token', { async: true }),
  metrics: hasMany('metric', { async: true }),
  settings: attr({
    defaultValue() {
      return {
        groupedEvents: true,
        showEventTriggers: false,
        filterEventsForNoBuilds: false,
        filterSchedulerEvents: false
      };
    }
  }),
  badges: attr({
    defaultValue() {
      return {
        sonar: {
          name: '',
          defaultName: '',
          uri: '',
          defaultUri: ''
        }
      };
    }
  }),

  appId: alias('scmRepo.name'),
  branch: computed('scmRepo.{branch,rootDir}', {
    get() {
      let { branch, rootDir } = this.scmRepo || {};

      if (rootDir) {
        branch = `${branch}:${rootDir}`;
      }

      return branch;
    }
  }),
  hubUrl: alias('scmRepo.url'),
  jobParameters: computed('jobs.[]', {
    get() {
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
  }),
  failedBuildCount: computed('metrics.[]', {
    get() {
      let failedBuildCount = 0;

      this.metrics.toArray().forEach(event => {
        if (['FAILURE', 'ABORTED'].includes(event.status)) {
          failedBuildCount += 1;
        }
      });

      return failedBuildCount;
    }
  }),
  lastRunEvent: computed('metrics.[]', {
    get() {
      const { lastEventInfo } = formatMetrics(this.metrics);

      return lastEventInfo;
    }
  })
});
