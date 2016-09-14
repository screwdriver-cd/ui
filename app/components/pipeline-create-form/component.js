/* global localStorage*/
import Ember from 'ember';
import git from '../../utils/git';

let LOCALSTORAGE_KEY = 'create-pipeline-data';

export default Ember.Component.extend({
  currentStep: 1,

  /**
   * Fires before the template is originally drawn
   * @event willInsertElement
   */
  init() {
    let scmUrl = this.get('scmUrl');

    if (git.parse(scmUrl).valid) {
      this.set('currentStep', 2);
    }

    this._super(...arguments);
  },

  savingChanged: Ember.observer('saveSuccess', function observe() {
    // Remove stored data when no longer saving and no errors
    if (this.get('saveSuccess')) {
      localStorage.removeItem(LOCALSTORAGE_KEY);
    }
  }),

  /**
   * Fetches project data from localstorage or return default
   * @property {Object} scmUrl
   */
  scmUrl: Ember.computed(() => {
    let storedData = '';

    try {
      storedData = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)) || storedData;
    // eslint-disable-next-line no-empty
    } catch (ignore) {}

    return storedData;
  }),

  actions: {
    /**
     * Call Api to save project
     * @event saveData
     * @param  {Object} data Project attributes
     */
    saveData() {
      const scmUrl = this.get('scmUrl');

      this.get('onCreatePipeline')(scmUrl);
    },

    /**
     * Saves the user data if the urls are valid
     * @event rememberProjectData
     * @param  {Object}            data scmUrl, extConfigUrl, repoUrl
     */
    rememberProjectData(scmUrl) {
      let scmUrlCheck = git.parse(scmUrl);

      // validate the url data
      if (!scmUrlCheck.valid) {
        // invalid urls, exit
        return;
      }

      // store scmUrl,etc data
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(scmUrl));

      this.set('scmUrl', scmUrl);
      this.set('currentStep', 2);
    },

    /**
     * Updates current step
     * @event updateStep
     * @param  {Number}   step
     */
    updateStep(step) {
      this.set('currentStep', step);
    }
  }
});
