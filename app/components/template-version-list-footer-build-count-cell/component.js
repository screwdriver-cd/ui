import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'td',
  classNames: ['metric-cell'],
  totalBuildCount: computed('data.[]', {
    get() {
      const data = this.get('data') || [];

      let totalBuildCount = 0;

      data.forEach(v => {
        totalBuildCount += v.metrics.buildCount;
      });

      return totalBuildCount;
    }
  })
});
