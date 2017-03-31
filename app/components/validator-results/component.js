/* global jsyaml */
import Ember from 'ember';

export default Ember.Component.extend({
  results: null,
  stringifiedResults: Ember.computed('results', {
    get() {
      return JSON.stringify(this.get('results'), null, 4);
    }
  }),
  errors: Ember.computed('results', {
    get() {
      return this.get('results.errors') || [];
    }
  }),
  workflow: Ember.computed('results', {
    get() {
      return this.get('results.workflow') || [];
    }
  }),
  jobs: Ember.computed('results', {
    get() {
      return this.get('results.jobs');
    }
  }),
  templateName: Ember.computed('results.template.name', 'results.template.version', {
    get() {
      return `${this.get('results.template.name')}@${this.get('results.template.version')}`;
    }
  })
});
