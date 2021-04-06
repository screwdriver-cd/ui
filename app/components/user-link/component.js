import Component from '@ember/component';
import { computed } from '@ember/object';
import ENV from 'screwdriver-ui/config/environment';

export default Component.extend({
  classNameBindings: ['large'],

  isOpenSourceInstance: computed(function() {
    return ENV.SDAPI_HOSTNAME === 'https://api.screwdriver.cd';
  })
});
