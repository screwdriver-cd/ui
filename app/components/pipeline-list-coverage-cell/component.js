import Component from '@ember/component';
import { inject as service } from '@ember/service';
import InViewportMixin from 'ember-in-viewport';

export default Component.extend(InViewportMixin, {
  shuttle: service(),

  init() {
    this._super(...arguments);

    this.setProperties({
      coverage: undefined,
      loaded: false,
      loading: false
    });
  },

  async didEnterViewport() {
    if (this.loaded === false) {
      try {
        this.set('loading', true);
        const coverage = await this.shuttle.fetchCoverage(this.value);

        this.setProperties({
          coverage,
          loaded: true
        });
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
});
