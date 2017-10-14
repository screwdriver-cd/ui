import { computed } from '@ember/object';
import Component from '@ember/component';

export default Component.extend({
  results: null,
  errors: computed('results', {
    get() {
      return (this.get('results.errors') || []).map(e => (typeof e === 'string' ? e : e.message));
    }
  }),
  workflow: computed('results', {
    get() {
      return this.get('results.workflow') || [];
    }
  }),
  annotations: computed('results', {
    get() {
      return this.get('results.annotations') || [];
    }
  }),
  jobs: computed('results', {
    get() {
      return this.get('results.jobs');
    }
  }),
  templateName: computed('results.template.{name,version}', {
    get() {
      return `${this.get('results.template.name')}@${this.get('results.template.version')}`;
    }
  })
});
