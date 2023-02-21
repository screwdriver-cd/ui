import Component from '@ember/component';
import { inject as service } from '@ember/service';

export default Component.extend({
  shuttle: service(),

  init() {
    this._super(...arguments);

    this.setProperties({
      coverage: undefined,
      loaded: false,
      loading: false
    });
  },

  actions: {
    async didEnterViewport() {
      if (this.loaded === false) {
        try {
          if (!this.isDestroyed && !this.isDestroying) {
            this.set('loading', true);
            const coverage = await this.shuttle.fetchCoverage(
              this.record.coverage
            );

            this.setProperties({
              coverage,
              loaded: true
            });
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('err', err);
        } finally {
          if (!this.isDestroyed && !this.isDestroying) {
            this.set('loading', false);
          }
        }
      }
    }
  }
});
