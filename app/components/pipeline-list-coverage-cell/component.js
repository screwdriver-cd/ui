import Component from '@ember/component';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),

  result: computed('value', {
    async get() {
      if (this.value.buildId) {
        if (this.value.coverage) {
          return this.value.coverage;
        }
        const coverage = await this.shuttle.fetchCoverage(this.value);

        this.set('value', { ...this.value, coverage });

        return coverage;
      }

      return '';
    }
  })
});
