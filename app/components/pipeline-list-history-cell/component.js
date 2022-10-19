import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  builds: computed('value', {
    get() {
      return this.value;
    }
  })
});
