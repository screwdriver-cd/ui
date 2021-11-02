import { set, action } from '@ember/object';
import classic from 'ember-classic-decorator';
import Component from '@ember/component';
import { tagName } from '@ember-decorators/component';

/**
 @class PipelineParameterizedBuild
 @namespace Components
 @extends Ember.Component
 @public
 */
@classic
@tagName('')
export default class PipelineParameterizedBuild extends Component {
  /**
   * showSubmitButton
   * @type {Boolean} true to show button groups, hide otherwise
   */
  showSubmitButton = false;

  /**
   * submitButtonText
   * @type {String} Submit
   */
  submitButtonText = 'Submit';

  /**
   * buildPipelineParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  buildPipelineParameters = {};

  /**
   * buildJobParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  buildJobParameters = {};

  /**
   * startFrom name of the job which is the entry point for the event
   * @type {String}
   */
  startFrom = null;

  /**
   * parameters expected to be an object
   * @type {String}
   */
  init() {
    super.init(...arguments);

    const normalizedParameters = this.getNormalizedParameterGroups(
      this.buildPipelineParameters,
      this.getDefaultPipelineParameters(),
      this.buildJobParameters,
      this.getDefaultJobParameters(),
      this.startFrom
    );

    const parameterizedModel =
      this.getNormalizedParameterizedModel(normalizedParameters);

    this.setProperties({
      parameters: normalizedParameters,
      parameterizedModel
    });
  }

  getDefaultPipelineParameters() {
    return this.pipeline?.parameters || {};
  }

  getDefaultJobParameters() {
    return this.pipeline?.jobParameters || {};
  }

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
  }

  getNormalizedParameterGroups(
    pipelineParameters = {},
    defaultPipelineParameters = {},
    jobParameters = {},
    defaultJobParameters = {},
    startFrom
  ) {
    let normalizedParameterGroups = [];
    const normalizedJobParameterGroups = [];

    Object.entries(jobParameters).forEach(([jobName, parameters]) => {
      const paramGroup = {
        jobName,
        parameters: this.normalizeParameters(
          parameters,
          defaultJobParameters[jobName]
        ),
        isOpen: false,
        paramGroupTitle: `Job: ${jobName}`
      };

      if (startFrom === jobName) {
        normalizedParameterGroups.push(paramGroup);
      } else {
        normalizedJobParameterGroups.push(paramGroup);
      }
    });

    if (Object.keys(pipelineParameters).length > 0) {
      normalizedParameterGroups.push({
        jobName: null,
        parameters: this.normalizeParameters(
          pipelineParameters,
          defaultPipelineParameters
        ),
        isOpen: false,
        paramGroupTitle: 'Shared'
      });
    }

    normalizedParameterGroups = normalizedParameterGroups.concat(
      normalizedJobParameterGroups
    );

    if (normalizedParameterGroups.length > 0) {
      normalizedParameterGroups[0].isOpen = true;
    }

    return normalizedParameterGroups;
  }

  normalizedParameterizedModel(normalizedParameters = []) {
    const normalizedParameterizedModel = {};

    normalizedParameters.forEach(normalizedParam => {
      let { value } = normalizedParam;

      if (Array.isArray(value)) {
        value = value[0] === undefined ? '' : value[0];
      }

      normalizedParameterizedModel[normalizedParam.name] = value;
    });

    return normalizedParameterizedModel;
  }

  getNormalizedParameterizedModel(normalizedParameters = []) {
    const normalizedParameterizedModel = {};

    normalizedParameters.forEach(entry => {
      if (entry.jobName === null) {
        Object.assign(
          normalizedParameterizedModel,
          this.normalizedParameterizedModel(entry.parameters)
        );
      } else {
        normalizedParameterizedModel[entry.jobName] =
          this.normalizedParameterizedModel(entry.parameters);
      }
    });

    return normalizedParameterizedModel;
  }

  updateValue({ model, jobName, propertyName, value }) {
    if (jobName === null) {
      set(model, propertyName, value);
    } else {
      const jobParameters = model[jobName];

      set(jobParameters, propertyName, value);
      set(model, jobName, jobParameters);
    }
  }

  @action
  searchOrAddtoList(model, jobName, propertyName, value, e) {
    if (e.keyCode === 13) {
      this.updateValue({
        model,
        jobName,
        propertyName,
        value: value.searchText
      });
    }
  }

  @action
  onUpdateValue(model, jobName, propertyName, value) {
    this.updateValue({ model, jobName, propertyName, value });
  }

  @action
  onExpandCollapseParamGroup(jobName) {
    const jobParamGroup = this.parameters.findBy('jobName', jobName);

    set(jobParamGroup, 'isOpen', !jobParamGroup.isOpen);
  }

  /**
   * This action is called when clicking on the submit button or form submission
   * @param parameterizedModel
   * @return {[type]} [description]
   */
  @action
  onSubmit() {
    this.onSave(this.parameterizedModel);
    if (this.onClose) {
      this.onClose();
    }
  }
}
