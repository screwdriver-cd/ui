import { computed, get, getWithDefault } from '@ember/object';
import Component from '@ember/component';
const { reads, map } = computed;

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
  templateName: computed('results.template.{name,version}', {
    get() {
      return `${get(this, 'results.template.name')}@${get(this, 'results.template.version')}`;
    }
  })
});
