import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'td',
  classNames: ['metric-cell'],
  totalJobCount: computed('data.[]', {
    get() {
      const data = this.get('data') || [];

      let totalJobCount = 0;

      data.forEach(v => {
        totalJobCount += v.metrics.jobCount;
      });

      return totalJobCount;
    }
  })
});
