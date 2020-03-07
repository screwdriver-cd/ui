import Component from '@ember/component';
import { computed } from '@ember/object';

export default Component.extend({
  builds: computed('value', {
    get() {
      const builds = [];

      for (let i = 1; i < this.value.length; i += 1) {
        builds.push({
          id: this.value[i].id,
          status: this.value[i].status
        });
      }

      return builds;
    }
  }),
});
