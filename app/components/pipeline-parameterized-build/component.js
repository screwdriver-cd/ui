import Component from '@ember/component';
import { getWithDefault, set } from '@ember/object';

/**
 @class PipelineParameterizedBuild
 @namespace Components
 @extends Ember.Component
 @public
 */
export default Component.extend({
  /**
   * showSubmitButton
   * @type {Boolean} true to show button groups, hide otherwise
   */
  showSubmitButton: false,

  /**
   * submitButtonText
   * @type {String} Submit
   */
  submitButtonText: 'Submit',

  /**
   * buildParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  buildParameters: {},

  /**
   * parameters expected to be an object
   * @type {String}
   */
  init() {
    this._super(...arguments);
    const [parameters, parameterizedModel] = this.normalizeParameters(this.buildParameters);

    this.setProperties({
      parameters,
      parameterizedModel
    });
  },

  /**
   * normalizeParameters transform given parameters from object into array of objects
   * this method also backfills with default properties
   * For example: {
        "_started_at": "simple",
        "user": {
          "value": "adong",
          "description": "User running build"
        }
   * }
   * to
   * [
   *  {
        name: "_started_at":
        value: "simple",
        description: ""
      }, {
        name: "user"
        value: "adong",
        description: "User running build"
      }
   * ]
   * @param  {Object} parameters [description]
   * @return {[type]}            [description]
   */
  normalizeParameters(parameters = {}) {
    const normalizedParameters = [];
    const normalizedParameterizedModel = {};

    Object.entries(parameters).forEach(([propertyName, propertyVal]) => {
      let value = propertyVal.value || propertyVal || '';
      const description = propertyVal.description || '';

      normalizedParameters.push({
        name: propertyName,
        value,
        description
      });

      if (Array.isArray(value)) {
        value = getWithDefault(value, '0', '');
      }

      normalizedParameterizedModel[propertyName] = value;
    });

    return [normalizedParameters, normalizedParameterizedModel];
  },

  /**
   * onSave action must be override
   * @return
   */
  onSave() {
    throw new Error('Not implemented');
  },

  /**
   * onCancel action must be override
   * @return
   */
  onCancel() {
    throw new Error('Not implemented');
  },

  /**
   * onClose action is optional that will be run at the end of actions
   * @return
   */
  onClose() {
    throw new Error('Not implemented');
  },

  updateValue({ model, propertyName, value }) {
    set(model, propertyName, value);
  },

  actions: {
    searchOrAddtoList(model, propertyName, value, e) {
      if (e.keyCode === 13) {
        this.updateValue({ model, propertyName, value: value.searchText });
      }
    },

    onUpdateDropdownValue(model, propertyName, value) {
      this.updateValue({ model, propertyName, value });
    },

    onUpdateValue(value, model, propertyName) {
      this.updateValue({ model, propertyName, value });
    },

    /**
     * This action is called when clicking on the submit button or form submission
     * @param parameterizedModel
     * @return {[type]} [description]
     */
    onSave() {
      this.get('onSave')(this.parameterizedModel);
      if (this.onClose) {
        this.onClose();
      }
    },

    onCancel() {
      this.get('onCancel')();
      if (this.onClose) {
        this.onClose();
      }
    }
  }
});
