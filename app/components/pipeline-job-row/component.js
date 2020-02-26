import Component from '@ember/component';
// import { computed, get, getProperties } from '@ember/object';
import { statusIcon } from 'screwdriver-ui/utils/build';

export default Component.extend({
  icon: statusIcon('SUCCESS'),
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
