import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  build: computed('value', {
    get() {
      const { build } = this.get('value');

      if (!build) {
        return null;
      }

      return {
        id: build.id,
        icon: statusIcon(build.status),
        status: build.status
      };
    }
  }),
  jobName: computed('value', {
    get() {
      return this.get('value').jobName;
    }
  })
});
