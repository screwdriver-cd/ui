import Component from '@ember/component';
import { computed } from '@ember/object';
import { getStateIcon } from 'screwdriver-ui/utils/pipeline';

export default Component.extend({
  stateIcon: computed('state', {
    get() {
      return getStateIcon(this.get('state'));
    },
    set(_, value) {
      return this._stateIcon = value;
    }
  }),
  stateName: computed('state', {
    get() {
      return this.get('state').toLowerCase();
    },
    set(_, value) {
      return this._stateName = value;
    }
  })
});
