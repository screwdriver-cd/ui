import { set } from '@ember/object';
import Component from '@ember/component';

/**
 * @typedef {Object} ParameterOption          Parameter name and value(s) (optional: description) pairs in Yaml
 * @property {string|Array<string>} value     Default parameter value(s) defined in Yaml
 * @property {string|undefined} description   Parameter description defined in Yaml
 */
/**
 * @typedef {string|Array<string>|ParameterOption} ParameterValue   Parameter Value(s) defined in Yaml
 */
/**
 * @typedef {Record<string, ParameterValue>} JobParameterValue      Job Parameter Value(s) defined in Yaml
 */
/**
 * @typedef {Object} Parameter                      Parameter information
 * @property {string|Array<string>} defaultValues   Default value(s) in Yaml
 * @property {string} description                   Parameter description ('' when unset)
 * @property {string} name                          Parameter name
 * @property {string|Array<string>} value           Current Value(s)
 */
/**
 * @typedef {Object} ParameterGroup           Parameter information with UI state
 * @property {boolean} isOpen                 Open/Closed state of parameter-group
 * @property {string|null} jobName            Job name (null when Shared parameter group)
 * @property {string} paramGroupTitle         'Shared' or 'Job: <Job name>'
 * @property {Array<Parameter>} parameters    Parameter array
 */
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
   * buildPipelineParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  buildPipelineParameters: {},

  /**
   * buildJobParameters are expected to be an object consists of key value pairs
   * @type {Object}
   */
  buildJobParameters: {},

  /**
   * startFrom name of the job which is the entry point for the event
   * @type {String}
   */
  startFrom: null,

  /**
   * Initialization
   */
  init() {
    this._super(...arguments);

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
  },

  /**
   * Get Shared parameters
   * @return {Record<string, ParameterValue>} Parameter name and value (optional: description) pairs
   * @example
   *    >>> getDefaultJobParameters(...)
   *    {
   *      namespace: 'sandbox'
   *      ...,
   *    }
   */
  getDefaultPipelineParameters() {
    return this.get('pipeline.parameters') === undefined
      ? {}
      : this.get('pipeline.parameters');
  },

  /**
   * Get Job parameters
   * @return {Record<string, JobParameterValue>} Job name and parameters pairs
   * @example
   *    >>> getDefaultJobParameters(...)
   *    {
   *      build: {
   *        image: 'alpine',
   *        tag: '1.0'
   *      },
   *      deploy: {...}
   *    }
   */
  getDefaultJobParameters() {
    return this.get('pipeline.jobParameters') === undefined
      ? {}
      : this.get('pipeline.jobParameters');
  },

  /**
   * normalizeParameters transform given parameters from object into array of objects
   * this method also backfills with default properties
   * @param  {Record<string, ParameterValue>} [parameters]          Parameter name and value pairs
   * @param  {Record<string, ParameterValue>} [defaultParameters]   Default parameter name and value pairs
   * @return {Array<Record<string, Parameter>>}                     Parameter information array
   * @example
   *    [{
   *      0: {
   *        name: 'image',
   *        value: 'alpine',
   *        defaultValues: 'alpine',
   *        description: ''
   *      },
   *      1: {
   *        name: 'tag',
   *        value: '1.0',
   *        defaultValues: ['1.0', '2.0', 'latest'],
   *        description: 'image version'
   *      },
   *      ...,
   *    }]
   */
  normalizeParameters(parameters = {}, defaultParameters = {}) {
    /** @type {Array<Record<string, Parameter>>} */
    const normalizedParameters = [];

    Object.entries(parameters).forEach(([propertyName, propertyVal]) => {
      const value = propertyVal.value || propertyVal || '';
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

  /**
   * Get normalized parameter groups
   * @param {Record<string, ParameterValue>} pipelineParameters         Pipeline parameters
   * @param {Record<string, ParameterValue>} defaultPipelineParameters  Default pipeline parameters
   * @param {Record<string, JobParameterValue>} jobParameters           Job parameters
   * @param {Record<string, JobParameterValue>} defaultJobParameters    Default job parameters
   * @param {string|null} startFrom                                     Starting job name (null when from the Start button)
   * @return {Array<Record<string, ParameterGroup>>}                    Job or Shared name and parameter information pairs
   * @example
   *    [
   *      {
   *        0: {
   *          isOpen: true,
   *          jobName: null,
   *          paramGroupTitle: 'Shared',
   *          parameters: {
   *            0: {
   *              name: 'namespace',
   *              value: 'sandbox',
   *              defaultValues: '',
   *              description: ''
   *            },
   *            1: {...},
   *          }
   *        }
   *      },
   *      {
   *        1: {
   *          isOpen: false,
   *          jobName: build,
   *          paramGroupTitle: 'Job: build',
   *          parameters: {...}
   *        }
   *      },
   *      {
   *        2: {...}
   *      }
   *    ]
   */
  getNormalizedParameterGroups(
    pipelineParameters = {},
    defaultPipelineParameters = {},
    jobParameters = {},
    defaultJobParameters = {},
    startFrom
  ) {
    /** @type {Array<Record<string, ParameterGroup>>} */
    let normalizedParameterGroups = [];
    /** @type {Array<Record<string, ParameterGroup>>} */
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

    if (normalizedParameterGroups.length > 0) {
      normalizedParameterGroups[0].isOpen = true;
    }

    normalizedParameterGroups = normalizedParameterGroups.concat(
      normalizedJobParameterGroups
    );

    return normalizedParameterGroups;
  },

  /**
   * Get pairs of parameter name and value
   * @param {Array<Parameter>} normalizedParameters
   * @return {Record<string, string>}
   * @example
   *    {
   *      image: 'alpine'
   *      tag: '1.0'
   *    }
   */
  normalizedParameterizedModel(normalizedParameters = []) {
    /** @type {Record<string, string>} */
    const normalizedParameterizedModel = {};

    normalizedParameters.forEach(normalizedParam => {
      let { value } = normalizedParam;

      if (Array.isArray(value)) {
        value = value[0] === undefined ? '' : value[0];
      }

      normalizedParameterizedModel[normalizedParam.name] = value;
    });

    return normalizedParameterizedModel;
  },

  /**
   * Get initial values of Shared parameters and Job parameters.
   * @param {Array<ParameterGroup>} [normalizedParameters]    Parameter group array
   * @return {Record<string, string|Record<string, string>>}  Parameter name and value pair (Summarized when job parameters)
   * @example
   *    {
   *      build: {image: 'alpine', tag: '1.0'}
   *      namespace: 'sandbox'
   *    }
   */
  getNormalizedParameterizedModel(normalizedParameters = []) {
    /** @type {Record<string, string|Record<string, string>>} */
    const normalizedParameterizedModel = {};

    normalizedParameters.forEach(entry => {
      if (entry.jobName === null) {
        // When Shared parameters
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

  updateValue({ model, jobName, propertyName, value }) {
    if (jobName === null) {
      set(model, propertyName, value);
    } else {
      const jobParameters = model[jobName];

      set(jobParameters, propertyName, value);
      set(model, jobName, jobParameters);
    }
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

    /**
     * Callback when clicked and opened ember-power-select-options
     * @param {string} propertyName
     * @param {import('ember-power-select/components/power-select').Select} value
     */
    onOpen(value) {
      setTimeout(() => {
        // Wait until select-options frame is displayed
        const collections = document.getElementsByClassName(
          'parameter-group-list'
        );

        if (collections.length === 0) {
          return;
        }
        const scrollFrame = collections[0];
        const optionsBox = document.getElementById(
          `ember-power-select-options-${value.uniqueId}`
        );

        if (optionsBox === null) {
          return;
        }
        const optionsBoxRect = optionsBox.getBoundingClientRect();
        const scrollFrameRect = scrollFrame.getBoundingClientRect();
        const hiddenAreaHeight = optionsBoxRect.bottom - scrollFrameRect.bottom;

        if (hiddenAreaHeight > 0) {
          scrollFrame.scrollBy({ top: hiddenAreaHeight + 10 });
        }
      }, 100);
    },

    /**
     * Callback when closed ember-power-select-options
     * In the following cases, the scroll function does not work properly
     * 1. the scrollbar is at the bottom when the box is closed.
     * 2. after 1, the box is opened again without changing the position of the scrollbars.
     * This is because the position of the scrollbar is saved behind the scenes, so when the select-options is reopened, it automatically scrolls to the previous scrollbar position.
     * Therefore, it is necessary to cause a recalculation of the scroll position when closing.
     */
    onClose() {
      setTimeout(() => {
        const collections = document.getElementsByClassName(
          'parameter-group-list'
        );

        if (collections.length === 0) {
          return;
        }
        const scrollFrame = collections[0];
        // Wait until select-options frame is hidden and scrollbar of parameter-group-list height is recalculated.
        const scrollRatio =
          scrollFrame.scrollTop /
          (scrollFrame.scrollHeight - scrollFrame.clientHeight);

        if (scrollRatio === 1) {
          scrollFrame.scrollBy({ top: -0.001 });
        }
      }, 100);
    },

    onUpdateValue(model, jobName, propertyName, value) {
      this.updateValue({ model, jobName, propertyName, value });
    },

    onExpandCollapseParamGroup(jobName) {
      const jobParamGroup = this.parameters.findBy('jobName', jobName);

      set(jobParamGroup, 'isOpen', !jobParamGroup.isOpen);
    },

    /**
     * This action is called when clicking on the submit button or form submission
     * @param parameterizedModel
     * @return {[type]} [description]
     */
    onSave() {
      this.onSave(this.parameterizedModel);
      if (this.onClose) {
        this.onClose();
      }
    },

    onCancel() {
      this.onCancel();
      if (this.onClose) {
        this.onClose();
      }
    }
  }
});
