import { debounce } from '@ember/runloop';
import { computed, observer } from '@ember/object';
import { inject as service } from '@ember/service';
import Controller from '@ember/controller';

/**
 * Fetches validator results in debounce
 * @method getResults
 * @private
 */
function getResults() {
  this.get('validator').getValidationResults(this.get('yaml'))
    .then(results => this.set('results', results));
}

export default Controller.extend({
  validator: service(),
  yaml: '',
  results: '',
  isTemplate: computed('yaml', {
    get() {
      return this.get('validator').isTemplate(this.get('yaml'));
    }
  }),
  onYamlChange: observer('yaml', function onYamlChange() {
    const yaml = this.get('yaml').trim();

    if (!yaml) {
      this.set('results', '');

      return;
    }

    debounce(this, getResults, 250);
  })
});
