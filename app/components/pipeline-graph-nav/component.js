import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  session: service(),
  isPR: computed('graphType', {
    get() {
      return this.graphType === 'pr';
    }
  }),
  prJobs: computed('selectedEventObj.prNum', 'prGroups', {
    get() {
      const prNum = this.get('selectedEventObj.prNum');
      const { prGroups } = this;

      return prGroups[prNum];
    }
  }),
  eventOptions: computed('lastSuccessful', 'mostRecent', 'isPR', {
    get() {
      const options = [
        { label: 'Most Recent', value: this.mostRecent },
        { label: 'Last Successful', value: this.lastSuccessful }
      ];

      if (!this.isPR) {
        options.push({ label: 'Aggregate', value: 'aggregate' });
      }

      return options;
    }
  }),
  icon: computed('selectedEventObj.status', {
    get() {
      return statusIcon(this.get('selectedEventObj.status'));
    }
  })
});
