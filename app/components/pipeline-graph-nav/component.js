import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export default Component.extend({
  session: service(),
  userSettings: service(),
  store: service(),
  isPR: computed('graphType', {
    get() {
      return this.graphType === 'pr';
    }
  }),
  prJobs: computed('selectedEventObj.prNum', 'prGroups', {
    get() {
      const prNum = this.get('selectedEventObj.prNum');

      return this.prGroups[prNum];
    }
  }),
  eventOptions: computed('lastSuccessful', 'mostRecent', 'isPR', {
    get() {
      const options = [
        { label: 'Most Recent', value: this.mostRecent },
        { label: 'Last Successful', value: this.lastSuccessful }
      ];

      return options;
    }
  }),
  showGraphNavRow: computed('selectedEventObj.type', 'isPR', {
    get() {
      const eventType = this.get('selectedEventObj.type');

      return !this.isPR || eventType === 'pr';
    }
  }),
  icon: computed('selectedEventObj.status', {
    get() {
      return statusIcon(this.get('selectedEventObj.status'));
    }
  }),
  startDate: computed('selectedEventObj.createTime', function get() {
    let startDate;

    const userPreferences = this.store.peekAll('preference/user');
    const timestampPreference = userPreferences.lastObject.timestampFormat;

    if (timestampPreference === 'UTC') {
      startDate = `${toCustomLocaleString(
        new Date(this.get('selectedEventObj.createTime')),
        { timeZone: 'UTC' }
      )}`;
    } else {
      startDate = `${toCustomLocaleString(
        new Date(this.get('selectedEventObj.createTime'))
      )}`;
    }

    return startDate;
  })
});
