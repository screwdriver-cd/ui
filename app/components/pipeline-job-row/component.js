import Component from '@ember/component';
import { computed } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  icon: statusIcon('SUCCESS'),
  todoChangeName: computed('job.history', {
    get() {
      const icons = [];

      this.job.history.forEach(build => {
        icons.push(statusIcon(build.status));
      });

      return this.get('events');
    }
  }),
  buildIcons: [
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS'),
    statusIcon('SUCCESS')
  ]
});
