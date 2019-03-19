import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  session: service(),
  isPR: computed('graphType', {
    get() {
      return this.get('graphType') === 'pr';
    }
  }),
  prJobs: computed('selectedEventObj.prNum', 'prGroups', {
    get() {
      const prNum = this.get('selectedEventObj.prNum');
      const prGroups = this.get('prGroups');

      return prGroups[prNum];
    }
  }),
  eventOptions: computed('lastSuccessful', 'mostRecent', 'isPR', {
    get() {
      const options = [
        { label: 'Most Recent', value: get(this, 'mostRecent') },
        { label: 'Last Successful', value: get(this, 'lastSuccessful') }
      ];

      if (!this.get('isPR')) {
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
