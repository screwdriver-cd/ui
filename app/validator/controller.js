import Ember from 'ember';

/**
 * Fetches validator results in debounce
 * @method getResults
 * @private
 */
function getResults() {
  this.get('validator').getValidationResults(this.get('yaml'))
    .then(results => this.set('results', results));
}

export default Ember.Controller.extend({
  validator: Ember.inject.service(),
  yaml: '',
  results: '',
  isTemplate: Ember.computed('yaml', {
    get() {
      return this.get('validator').isTemplate(this.get('yaml'));
    }
  }),
  onYamlChange: Ember.observer('yaml', function onYamlChange() {
    const yaml = this.get('yaml').trim();

    if (!yaml) {
      this.set('results', '');

      return;
    }

    Ember.run.debounce(this, getResults, 250);
  })
});
