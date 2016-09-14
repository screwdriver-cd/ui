import Ember from 'ember';
import git from '../../utils/git';

/**
 * Animates the input to indicate whether the value is a valid scm url or not
 * @method indicateValidScmUrl
 * @param  {String}         elementSelector jQuery selector of the input element
 * @param  {String}         val             value of the input element aka the scm url
 * @return {Boolean}                        whether or not the input is valid
 */
function indicateValidScmUrl(elementSelector, val = '') {
  if (val.length !== 0 && !git.parse(val).valid) {
    Ember.$(elementSelector).addClass('bad-text-input');
  } else if (val.length !== 0) {
    Ember.$(elementSelector).addClass('good-text-input');

    return true;
  }

  return false;
}

/**
 * Enables/disables the 'use this repository' button based on the validity of inputs
 * @method validateScmInput
 * @param  {String}         scmUrl   The scmUrl entered by the user
 * @return {Boolean}                 True if the scmUrl is valid
 */
function validateScmInput(scmUrl) {
  Ember.$('.text-input').removeClass('bad-text-input');
  Ember.$('.text-input').removeClass('good-text-input');
  Ember.$('.blue-button').prop('disabled', true);

  let checkScmUrl = indicateValidScmUrl('.scm-url', scmUrl);

  if (checkScmUrl) {
    Ember.$('.blue-button').prop('disabled', false);

    return true;
  }

  return false;
}

export default Ember.Component.extend({
  /**
   * Fires before the template is originally drawn
   * @event willInsertElement
   */
  willInsertElement() {
    let scmUrl = this.get('scmUrl');

    if (validateScmInput(scmUrl)) {
      this.sendAction('updateData', scmUrl);
    }
  },

  /**
   * Fires after the template is drawn, needed trigger appropriate styling on good/bad input
   * @event didInsertElement
   */
  didInsertElement() {
    validateScmInput(this.get('scmUrl'));
  },

  actions: {
    /**
     * Handles when a git url is entered in step 1
     * @method scmChange
     * @param  {String} val     The value of the input box
     */
    scmChange(val) {
      this.set('scmUrl', val.trim());
      this.get('returnToStep')(1);
      validateScmInput(this.get('scmUrl'));
    },

    /**
     * Handles when a git url is entered in step 1
     * @method updateData
     */
    updateData() {
      this.get('updateData')(this.get('scmUrl'));
    }
  }
});
