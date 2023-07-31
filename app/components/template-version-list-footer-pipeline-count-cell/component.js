import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  tagName: 'td',
  classNames: ['metric-cell'],
  totalJobCount: computed('data.[]', {
    get() {
      const data = this.get('data') || [];

      let totalPipelineCount = 0;

      data.forEach(v => {
        totalPipelineCount += v.metrics.pipelineCount;
      });

      return totalPipelineCount;
    }
  })
});
