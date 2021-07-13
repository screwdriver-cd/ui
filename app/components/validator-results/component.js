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
      return get(this, 'results.workflowGraph') === undefined
                ? { nodes: [], edges: [] }
                : get(this, 'results.workflowGraph');
    }
  }),
  annotations: computed('results.annotations', {
    get() {
      return get(this, 'results.annotations') === undefined ? [] : get(this, 'results.annotations');
    }
  }),
  parameters: computed('results.parameters', {
    get() {
      return get(this, 'results.parameters') === undefined ? {} : get(this, 'results.parameters');
    }
  }),
  warnMessages: map('results.warnMessages', w => (typeof w === 'string' ? w : w.message)),
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
