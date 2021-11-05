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
   * jobParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  jobParameters: {},

  /**
   * parameters expected to be an object
   * @type {String}
   */
  init() {
    this._super(...arguments);
    const normalizedPipelineParameters = this.normalizeParameters(
      this.buildParameters,
      this.getDefaultPipelineParameters()
    );
    const normalizedJobParameters = this.normalizeJobParameters(
      this.jobParameters,
      this.getDefaultJobParameters()
    );
    const parameterizedModel = Object.assign(
      this.getNormalizedParameterizedPipelineModel(
        normalizedPipelineParameters
      ),
      this.getNormalizedParameterizedJobModel(normalizedJobParameters)
    );

    this.setProperties({
      parameters: normalizedPipelineParameters,
      jobParameters: normalizedJobParameters,
      parameterizedModel
    });
  },

  getDefaultPipelineParameters() {
    return this.getWithDefault('pipeline.parameters', {});
  },

  getDefaultJobParameters() {
    const jobs = this.getWithDefault('pipeline.jobs', []);
    const parameters = {};

    jobs.forEach(job => {
      const jobParameters = job.permutations[0].parameters; // TODO: Revisit while supporting matrix job

      if (jobParameters) {
        parameters[job.name] = jobParameters;
      }
    });
  },

  /**
   * normalizeParameters transform given parameters from object into array of objects
   * this method also backfills with default properties
   * For example:
   * parameters = {
        "_started_at": "simple",
        "user": {
          "value": "adong",
          "description": "User running build"
        }
     }
     defaultParameters = {
        "user": {
          "value": "dummy",
          "description": "User running build"
        }
   * }
   * to
   * [
   *  {
        name: "_started_at":
        value: "simple",
        defaultValues: "simple"
        description: ""
      }, {
        name: "user"
        value: "adong",
        defaultValues: "dummy"
        description: "User running build"
      }
   * ]
   * @param  {Object} parameters        [description]
   * @param  {Object} defaultParameters [description]
   * @return {[type]}                   [description]
   */
  normalizeParameters(parameters = {}, defaultParameters = {}) {
    const normalizedParameters = [];

    Object.entries(parameters).forEach(([propertyName, propertyVal]) => {
      let value = propertyVal.value || propertyVal || '';
      const description = propertyVal.description || '';
      // If no default value is found, fill with build parameter value
      const defaultPropertyVal = defaultParameters[propertyName]
        ? defaultParameters[propertyName]
        : value;
      const defaultValue =
        defaultPropertyVal.value || defaultPropertyVal || value;

      normalizedParameters.push({
        name: propertyName,
        value,
        defaultValues: defaultValue,
        description
      });
    });

    return normalizedParameters;
  },

  normalizeJobParameters(jobParameters = {}, defaultJobParameters = {}) {
    const normalizedJobParameters = [];

    Object.entries(jobParameters).forEach(([jobName, parameters]) => {
      normalizedJobParameters.push({
        jobName,
        parameters: this.normalizeParameters(
          parameters,
          defaultJobParameters[jobName]
        )
      });
    });

    return normalizedJobParameters;
  },

  getNormalizedParameterizedModel(normalizedParameters = []) {
    const normalizedParameterizedModel = {};

    normalizedParameters.forEach(normalizedParam => {
      let { value } = normalizedParam;

      if (Array.isArray(value)) {
        value = getWithDefault(value, '0', '');
      }

      normalizedParameterizedModel[normalizedParam.name] = value;
    });

    return normalizedParameterizedModel;
  },

  getNormalizedParameterizedPipelineModel(normalizedPipelineParameters = []) {
    return this.getNormalizedParameterizedModel(normalizedPipelineParameters);
  },

  getNormalizedParameterizedJobModel(normalizedJobParameters = []) {
    const normalizedParameterizedModel = {};

    normalizedJobParameters.forEach(entry => {
      normalizedParameterizedModel[entry.jobName] =
        this.getNormalizedParameterizedModel(entry.parameters);
    });

    return normalizedParameterizedModel;
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
    searchOrAddtoList(model, jobName, propertyName, value, e) {
      if (e.keyCode === 13) {
        this.updateValue({
          model,
          jobName,
          propertyName,
          value: value.searchText
        });
      }
    },

    onUpdateValue(model, jobName, propertyName, value) {
      const property = `${jobName}.${propertyName}`;

      this.updateValue({ model, property, value });
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
