import Component from '@ember/component';
import { computed } from '@ember/object';
import timeRange, {
  toCustomLocaleString
} from 'screwdriver-ui/utils/time-range';

export default Component.extend({
  classNames: ['chart-controls'],
  selectedRange: 'none',
  timeRanges: [
    { alias: '6hr', value: '6hr' },
    { alias: '12hr', value: '12hr' },
    { alias: '1d', value: '1d' },
    { alias: '1wk', value: '1wk' },
    { alias: '1mo', value: '1mo' },
    { alias: '3mo', value: '3mo' },
    { alias: '6mo', value: '180d' },
    { alias: '1yr', value: '1yr' },
    // whats best value for all?
    { alias: 'all', value: null } // should be disabled since it's not used in the backend
  ],
  init() {
    this._super(...arguments);
    if (
      !this.get('selectedRange') &&
      this.get('startTime') &&
      this.get('endTime')
    ) {
      // only show 'none' option if above condition is met
      if (!this.timeRanges.find(range => range.alias === 'none')) {
        this.timeRanges.unshift({ alias: 'none', value: 'none' });
      }
      this.set('selectedRange', 'none');

      return;
    }
    // 'none' option should not be available as options
    this.timeRanges = this.timeRanges.filter(range => range.alias !== 'none');
  },
  // flatpickr addon seems to prefer dates in string
  customRange: computed('startTime', 'endTime', {
    get() {
      if (!this.get('startTime')) return null;

      return ['startTime', 'endTime'].map(t =>
        toCustomLocaleString(new Date(this.get(t)), {
          options: {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }
        })
      );
    }
  }),

  actions: {
    setTimeRange(range) {
      console.log('range: ', range);
      if (this.selectedRange === range) {
        return;
      }

      this.set('selectedRange', range);

      if (range) {
        const { startTime, endTime } = timeRange(new Date(), range);

        this.onTimeRangeChange(startTime, endTime, this.selectedRange);
      } else {
        this.onTimeRangeChange();
      }
    },
    setCustomRange([start, end]) {
      this.set('selectedRange', 'none');

      if (start) {
        end.setHours(23, 59, 59);
        this.onTimeRangeChange(start.toISOString(), end.toISOString());
      } else {
        // always set end to a minute before EOD, and of local time
        this.onTimeRangeChange();
      }
    }
  }
});
