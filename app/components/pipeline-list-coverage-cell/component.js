import classic from 'ember-classic-decorator';
import { inject as service } from '@ember/service';
import Component from '@ember/component';
import InViewportMixin from 'ember-in-viewport';

@classic
export default class PipelineListCoverageCell extends Component.extend(
  InViewportMixin
) {
  @service
  shuttle;

  init() {
    super.init(...arguments);

    this.setProperties({
      coverage: undefined,
      loaded: false,
      loading: false
    });
  }

  async didEnterViewport() {
    if (this.loaded === false) {
      try {
        if (!this.isDestroyed && !this.isDestroying) {
          this.set('loading', true);
          const coverage = await this.shuttle.fetchCoverage(this.value);

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
