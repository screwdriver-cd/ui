import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  jobs: computed('test', {
    get() {
      const j = this.get('test');

      console.log(j);

      return j;
    }
  })
});
