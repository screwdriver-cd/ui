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
  automaticYamlCreation: false,
  scmService: service('scm'),
  template: service(),
  results: '',
  validator: service(),
  session: service(),
  prUrl: '',
  scmUrl: '',
  rootDir: '',
  isInvalid: not('isValid'),
  isDisabled: or('isSaving', 'isInvalid'),
  autoKeysGeneration: false,

  messageForSearching: computed('templates.[]', 'templates.options.length', {
    get() {
      if (this.templates.options.length) {
        return 'Not found.';
      }

      return 'Loading...';
    }
  }),

  isValid: computed('scmUrl', {
    get() {
      const val = this.scmUrl;

      const isValid = val.length !== 0 && parse(val).valid;

      this.set('scmUrl', val.trim());
      const input = $('.scm-url');

      input.removeClass('bad-text-input good-text-input');

      if (isValid) {
        input.addClass('good-text-input');
      } else if (val.trim().length > 0) {
        input.addClass('bad-text-input');
      }

      return isValid;
    }
  }),

  searchInputMatcher: function matcher(template, term) {
    const searchString = term.trim().toLowerCase();
    const text = `${template.name} ${template.namespace}`.toLowerCase();

    return text.indexOf(searchString);
  },

  hasAutoDeployEnabled: computed({
    get() {
      const { session } = this;
      const currentContext = session.get('data.authenticated.scmContext');
      const scm = this.scmService.getScm(currentContext);

      return scm.autoDeployKeyGeneration;
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
        const payload = {
          scmUrl: this.scmUrl,
          rootDir: this.rootDir,
          autoKeysGeneration: this.autoKeysGeneration
        };

        if (this.automaticYamlCreation) {
          payload.yaml = this.yaml;
        }

        this.onCreatePipeline(payload);
      }
    },

    async selectTemplate(selectedTemplate) {
      const yaml = `jobs:\n${SEPARATOR}main:\n${SEPARATOR}${SEPARATOR}template: ${selectedTemplate.namespace}/${selectedTemplate.name}\n${SEPARATOR}${SEPARATOR}requires: [~pr, ~commit]`;

      this.setProperties({ selectedTemplate, yaml });
    }
  }
});
