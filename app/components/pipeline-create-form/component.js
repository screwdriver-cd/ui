import $ from 'jquery';
import { not, or } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { parse } from '../../utils/git';

export default Component.extend({
  scmUrl: '',
  rootDir: '',
  isInvalid: not('isValid'),
  isDisabled: or('isSaving', 'isInvalid'),

  isValid: computed('scmUrl', {
    get() {
      const val = this.scmUrl;

      return val.length !== 0 && parse(val).valid;
    }
  }),

  actions: {
    /**
     * Handles when a git url is entered in step 1
     * @method scmChange
     * @param  {String} val     The value of the input box
     */
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = $('.scm-url');

      input.removeClass('bad-text-input good-text-input');

      if (this.isValid) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }
    },

    /**
     * Update rootdir
     * @method updateRootDir
     * @param  {String}      val The value of the rootDir input box
     */
    updateRootDir(val) {
      this.set('rootDir', val.trim());
    },

    /**
     * Call Api to save project
     * @event saveData
     * @param  {Object} data Project attributes
     */
    saveData() {
      if (this.isValid) {
        this.onCreatePipeline({
          scmUrl: this.scmUrl,
          rootDir: this.rootDir
        });
      }
    }
  }
});
