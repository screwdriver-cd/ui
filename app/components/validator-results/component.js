import { computed, get } from '@ember/object';
import { map, reads } from '@ember/object/computed';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import templateHelper from 'screwdriver-ui/utils/template';
const { getFullName } = templateHelper;

export default Component.extend({
  store: service(),
  results: null,
  jobs: computed('results.jobs', {
    get() {
      const configJobs = get(this, 'results.jobs') || {};
      const jobs = [];

      Object.entries(configJobs).forEach(([jobName, jobConfig]) => {
        jobs.push(
          this.store.createRecord('job', {
            name: jobName,
            permutations: jobConfig,
            archived: false
          })
        );
      });

      return jobs;
    }
  }),
  stages: computed('results.stages', {
    get() {
      const configStages = get(this, 'results.stages') || {};
      const stages = [];

      Object.entries(configStages).forEach(([stageName, stageConfig]) => {
        stages.push(
          this.store.createRecord('stage', {
            name: stageName,
            description: stageConfig.description
          })
        );
      });

      return stages;
    }
  }),
  errors: map('results.errors', e => (typeof e === 'string' ? e : e.message)),
  workflowGraph: computed('results.workflowGraph', {
    get() {
      return get(this, 'results.workflowGraph') === undefined
        ? {
            nodes: [],
            edges: []
          }
        : get(this, 'results.workflowGraph');
    }
  }),
  annotations: computed('results.annotations', {
    get() {
      return get(this, 'results.annotations') === undefined
        ? []
        : get(this, 'results.annotations');
    }
  }),
  parameters: computed('results.parameters', {
    get() {
      return get(this, 'results.parameters') === undefined
        ? {}
        : get(this, 'results.parameters');
    }
  }),
  warnMessages: map('results.warnMessages', w =>
    typeof w === 'string' ? w : w.message
  ),
  templateName: computed('results.template.{namespace,name,version}', {
    get() {
      // construct full template name
      const fullName = getFullName({
        name: this.get('results.template.name'),
        namespace: this.get('results.template.namespace')
      });

      return `${fullName}@${get(this, 'results.template.version')}`;
    }
  }),
  pipelineTemplateJobs: reads('results.template.config.jobs'),
  pipelineTemplateJobKeys: computed('results.template.config.jobs', {
    get() {
      return get(this, 'results.template.config.jobs') === undefined
        ? []
        : Object.keys(this.get('results.template.config.jobs'));
    }
  })
});
