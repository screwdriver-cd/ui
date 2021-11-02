import classic from 'ember-classic-decorator';
import { observes } from '@ember-decorators/object';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
/* eslint-disable ember/alias-model-in-controller */
// The route for this controller does not expose a model to alias.
import { debounce } from '@ember/runloop';
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

@classic
export default class ValidatorController extends Controller {
  @service
  validator;

  yaml = '';

  results = '';

  @computed('yaml')
  get isTemplate() {
    return this.validator.isTemplate(this.yaml);
  }

  // eslint-disable-next-line ember/no-observers
  @observes('yaml')
  onYamlChange() {
    const yaml = this.yaml.trim();

    if (!yaml) {
      this.set('results', '');

      return;
    }

    debounce(this, getResults, 250);
  }
}

export { getResults };
