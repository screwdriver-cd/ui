/* eslint-disable ember/alias-model-in-controller */
// The route for this controller does not expose a model to alias.
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
  this.validator
    .getValidationResults(this.yaml)
    .then(results => this.set('results', results));
}

export default Controller.extend({
  validator: service(),
  yaml: '',
  results: '',
  isJobTemplate: computed('yaml', {
    get() {
      return this.validator.isJobTemplate(this.yaml);
    }
  }),
  isPipelineTemplate: computed('yaml', {
    get() {
      return this.validator.isPipelineTemplate(this.yaml);
    }
  }),
  // eslint-disable-next-line ember/no-observers
  onYamlChange: observer('yaml', function onYamlChange() {
    const yaml = this.yaml.trim();

    if (!yaml) {
      this.set('results', '');

      return;
    }

    debounce(this, getResults, 250);
  })
});

export { getResults };
