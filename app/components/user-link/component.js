import Component from '@ember/component';
import { computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  classNameBindings: ['large'],

  showAvatar: computed(() => ENV.APP.SHOW_AVATAR === true)
});
