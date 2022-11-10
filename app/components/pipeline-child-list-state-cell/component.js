import Component from '@ember/component';
import { computed } from '@ember/object';
import { getStateIcon } from 'screwdriver-ui/utils/pipeline';

export default Component.extend({
  stateIcon: computed('state', {
    get() {
      return getStateIcon(this.get('state'));
    }
  }),
  stateName: computed('state', {
    get() {
      return this.get('state').toLowerCase();
    }
  })
});
