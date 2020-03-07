import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  build: computed('value', {
    get() {
      return {
        id: this.value.id,
        icon: statusIcon(this.value.status),
        status: this.value.status,
        jobName: this.value.jobName
      };
    }
  })
});
