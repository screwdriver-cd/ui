import Component from '@ember/component';
import { set } from '@ember/object';

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
   * parameterText are expected to be an object consists of key value pairs
   * @type {Object}
   */
  parameterText: {},

  /**
   * parameterSelect are expected to be an object consists of key value pairs
   * @type {Object}
   */
  parameterSelect: {},

  /**
   * parameters expected to be an object
   * @type {String}
   */
  init() {
    this._super(...arguments);
    const [parameters, parameterizedModel] = this.normalizeParameters(this.buildParameters);

    this.parameterSelect = {};
    this.parameterText = {};

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
  normalizeParameters(parameters = {}, selectedValue) {
    const normalizedParameters = [];
    const normalizedParameterizedModel = {};

    Object.entries(parameters).forEach(([propertyName, propertyVal]) => {
      const value = propertyVal.value || propertyVal || '';
      const description = propertyVal.description || '';
      // value to update selected parameter
      let listSelected = { name: value[0] };

      const selectParameters = [];

      if (Array.isArray(value)) {
        // initialize selected list
        normalizedParameterizedModel[propertyName] = value[0];
        if (this.parameterText[propertyName]) {
          // when already selected
          normalizedParameterizedModel[propertyName] = this.parameterText[propertyName];
        }

        // make data to set values of each parameter
        value.forEach(v => {
          const selectParam = { name: v, propertyName };

          selectParameters.push(selectParam);
        });
      }

      if (this.parameterSelect[propertyName]) {
        // use kept value for parameter which is selected at least once
        listSelected = this.parameterSelect[propertyName];
      }

      if (selectedValue && selectedValue.propertyName === propertyName) {
        // when list is selected for the parameter, keep it
        this.parameterSelect[propertyName] = { name: selectedValue.name };
        listSelected = this.parameterSelect[propertyName];

        this.parameterText[selectedValue.propertyName] = selectedValue.name;
        normalizedParameterizedModel[selectedValue.propertyName] = selectedValue.name;
      } else if (typeof value === 'string') {
        // not select but textbox
        normalizedParameterizedModel[propertyName] = value;
        if (this.parameterText[propertyName]) {
          normalizedParameterizedModel[propertyName] = this.parameterText[propertyName];
        }
      }

      normalizedParameters.push({
        name: propertyName,
        value,
        description,
        selectParameters,
        listSelected
      });
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

  actions: {
    onUpdateValue(value, model, propertyName) {
      this.parameterText[propertyName] = value;
      set(model, propertyName, value);
    },

    selectParameter(value) {
      const [parameters, parameterizedModel] = this.normalizeParameters(
        this.buildParameters,
        value
      );

      this.setProperties({ parameters, parameterizedModel });
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
