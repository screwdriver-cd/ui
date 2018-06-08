/* global localStorage */
import $ from 'jquery';

import { not, or } from '@ember/object/computed';
import { computed } from '@ember/object';
import Component from '@ember/component';
import { parse } from '../../utils/git';

export default Component.extend({
  scmUrl: '',
  isInvalid: not('isValid'),
  isDisabled: or('isSaving', 'isInvalid'),

  isValid: computed('scmUrl', {
    get() {
      const val = this.get('scmUrl');

      return val.length !== 0 && parse(val).valid;
    }
  }),

  actions: {
    canSave() {
      if (this.get('isValid')) {
        this.send('saveData');
      }
    },
    /**
     * Handles when a git url is entered in step 1
     * @method scmChange
     * @param  {String} val     The value of the input box
     */
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = $('.text-input');

      input.removeClass('bad-text-input good-text-input');

      if (this.get('isValid')) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }
    },

    /**
     * Call Api to save project
     * @event saveData
     * @param  {Object} data Project attributes
     */
    saveData() {
      this.get('onCreatePipeline')(this.get('scmUrl'));
    }
  }
});
