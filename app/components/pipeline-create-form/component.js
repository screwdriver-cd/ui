import $ from 'jquery';
import { not, or } from '@ember/object/computed';
import { computed, observer } from '@ember/object';
import { debounce } from '@ember/runloop';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { getResults } from 'screwdriver-ui/validator/controller';
import { parse } from '../../utils/git';

const SEPARATOR = '  '; // 2 spaces

export default Component.extend({
  selectedTemplate: {},
  templates: [],
  overrideScrewdriverYaml: false,
  template: service(),
  results: '',
  validator: service(),

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

  // eslint-disable-next-line ember/no-observers
  onYamlChange: observer('yaml', function onYamlChange() {
    const yaml = this.yaml.trim();

    if (!yaml) {
      this.set('results', '');

      return;
    }

    debounce(this, getResults, 250);
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
    },

    async selectTemplate(selectedTemplate) {
      const yaml = `jobs:\n${SEPARATOR}main:\n${SEPARATOR}${SEPARATOR}template: ${selectedTemplate.name}\n${SEPARATOR}${SEPARATOR}steps:\n${SEPARATOR}${SEPARATOR}${SEPARATOR}- step1: echo ok\n${SEPARATOR}${SEPARATOR}${SEPARATOR}- step2: echo ok`;

      this.setProperties({ selectedTemplate, yaml });
    }
  }
});
