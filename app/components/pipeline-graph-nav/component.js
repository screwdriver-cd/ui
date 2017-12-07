import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';

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
  })
});
