import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  session: service(),
  eventOptions: computed('lastSuccessful', 'mostRecent', {
    get() {
      return [
        { label: 'Most Recent', value: get(this, 'mostRecent') },
        { label: 'Last Successful', value: get(this, 'lastSuccessful') },
        { label: 'Aggregate', value: 'aggregate' }
      ];
    }
  }),
  icon: computed('selectedEventObj.status', {
    get() {
      return statusIcon(this.get('selectedEventObj.status'));
    }
  })
});
