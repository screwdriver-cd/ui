import { computed, get, getWithDefault } from '@ember/object';
import Component from '@ember/component';
import templateHelper from 'screwdriver-ui/utils/template';
const { reads, map } = computed;
const { getFullName } = templateHelper;

export default Component.extend({
  results: null,
  jobs: reads('results.jobs'),
  errors: map('results.errors', e => (typeof e === 'string' ? e : e.message)),
  workflowGraph: computed('results.workflowGraph', {
    get() {
      return getWithDefault(this, 'results.workflowGraph', { nodes: [], edges: [] });
    }
  }),
  annotations: computed('results.annotations', {
    get() {
      return getWithDefault(this, 'results.annotations', []);
    }
  }),
  parameters: computed('results.parameters', {
    get() {
      return getWithDefault(this, 'results.parameters', {});
    }
  }),
  warnAnnotations: map('results.warnAnnotations', w => (typeof w === 'string' ? w : w.message)),
  templateName: computed('results.template.{namespace,name,version}', {
    get() {
      // construct full template name
      const fullName = getFullName({
        name: this.get('results.template.name'),
        namespace: this.get('results.template.namespace')
      });

      return `${fullName}@${get(this, 'results.template.version')}`;
    }
  })
});
