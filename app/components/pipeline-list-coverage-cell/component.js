import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),

  result: computed('value', {
    async get() {
      return this.shuttle.fetchCoverage(this.value);
    }
  })
});
