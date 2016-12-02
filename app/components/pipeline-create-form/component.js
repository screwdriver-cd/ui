/* global localStorage*/
import Ember from 'ember';
import git from '../../utils/git';

export default Ember.Component.extend({
  scmUrl: '',
  isSaving: false,
  isValid: Ember.computed('scmUrl', {
    get() {
      const val = this.get('scmUrl');

      return val.length !== 0 && git.parse(val).valid;
    }
  }),
  isInvalid: Ember.computed.not('isValid'),
  isDisabled: Ember.computed.or('isSaving', 'isInvalid'),

  actions: {
    /**
     * Handles when a git url is entered in step 1
     * @method scmChange
     * @param  {String} val     The value of the input box
     */
    scmChange(val) {
      this.set('scmUrl', val.trim());
      const input = Ember.$('.text-input');

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
