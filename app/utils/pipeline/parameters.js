/**
 * Determines if a parameter is a pipeline parameter
 * @param parameter {{object}} The parameter object
 * @returns {boolean}
 */
export function isPipelineParameter(parameter) {
  return parameter.value !== undefined;
}

/**
 * Extracts parameters from the API response object of an event
 * @param event
 * @returns {{pipelineParameters: {}, jobParameters: {}}}
 */
export function extractEventParameters(event) {
  const eventParameters = event.meta.parameters || {};
  const pipelineParameters = {};
  const jobParameters = {};

  // Extract pipeline level and job level parameters
  Object.entries(eventParameters).forEach(([propertyName, propertyVal]) => {
    if (isPipelineParameter(propertyVal)) {
      pipelineParameters[propertyName] = propertyVal;
    } else {
      jobParameters[propertyName] = propertyVal;
    }
  });

  return {
    pipelineParameters,
    jobParameters
  };
}

/**
 * Extracts job parameters from the API response object of a job
 */
export function extractJobParameters(jobs) {
  if (jobs.length === 0) {
    return {};
  }

  return jobs.reduce((jobParameters, job) => {
    if (job.permutations && job.permutations.length > 0) {
      jobParameters[job.name] = job.permutations[0].parameters;
    }

    return jobParameters;
  }, {});
}

/**
 * Extracts default parameters from the API response object of a parameter
 * @param parameters A parameter object from the API response (handles both pipeline level and job level parameters)
 * @return {Object} The default parameters as an object with the shape {parameterName: {value: parameterValue}}.
 */
export function extractDefaultParameters(parameters) {
  const defaultParameters = {};

  if (parameters) {
    Object.entries(parameters).forEach(([parameterName, parameter]) => {
      let value;

      if (Array.isArray(parameter)) {
        value = parameter[0];
      } else if (parameter.value) {
        if (Array.isArray(parameter.value)) {
          value = parameter.value[0];
        } else {
          value = parameter.value;
        }
      } else {
        value = parameter;
      }

      defaultParameters[parameterName] = { value };
    });
  }

  return defaultParameters;
}

/**
 * Extracts default job parameters from the API response object of a job.
 * The returned format is the same as the job parameters as returned by the API in an event object.
 * @param jobs The jobs array from the API response
 * @return {Object} The job default parameters with the shape {jobName: {parameterName: {value: parameterValue}}}
 */
export function extractDefaultJobParameters(jobs) {
  if (jobs && jobs.length > 0) {
    return jobs.reduce((jobParameters, job) => {
      const parameters = extractDefaultParameters(
        job.permutations[0].parameters
      );

      if (Object.keys(parameters).length > 0) {
        jobParameters[job.name] = parameters;
      }

      return jobParameters;
    }, {});
  }

  return {};
}

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
export function normalizeParameters(parameters = {}, defaultParameters = {}) {
  /** @type {Array<Record<string, Parameter>>} */
  const normalizedParameters = [];

  Object.entries(parameters).forEach(([propertyName, propertyVal]) => {
    const value = propertyVal.value || propertyVal;
    const description = propertyVal.description || '';
    // If no default value is found, fill with build parameter value
    const defaultPropertyVal = Object.hasOwn(defaultParameters, propertyName)
      ? defaultParameters[propertyName]
      : value;
    const defaultPropertyDescription = Object.hasOwn(
      defaultParameters,
      propertyName
    )
      ? defaultParameters[propertyName].description || description
      : description;
    const defaultValue = defaultPropertyVal.value || defaultPropertyVal;

    normalizedParameters.push({
      name: propertyName,
      value,
      defaultValues: defaultValue,
      description: defaultPropertyDescription
    });
  });

  return normalizedParameters;
}

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
export function getNormalizedParameterGroups(
  pipelineParameters = {},
  defaultPipelineParameters = {},
  jobParameters = {},
  defaultJobParameters = {},
  startFrom
) {
  /** @type {Array<Record<string, ParameterGroup>>} */
  const normalizedParameterGroups = [];
  /** @type {Array<Record<string, ParameterGroup>>} */
  const normalizedJobParameterGroups = [];

  Object.entries(jobParameters).forEach(([jobName, parameters]) => {
    const paramGroup = {
      jobName,
      parameters: normalizeParameters(
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
      parameters: normalizeParameters(
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

  return normalizedParameterGroups.concat(normalizedJobParameterGroups);
}

/**
 * Flattens value key to the parent object
 * @param parameters
 * @returns {{}}
 */
export function flattenParameterGroup(parameters) {
  const flattened = {};

  Object.entries(parameters).forEach(([key, value]) => {
    flattened[key] = value.value;
  });

  return flattened;
}

/**
 * Flattens the parameter group of a job
 * @param parameters
 * @returns {{}}
 */
export function flattenJobParameters(parameters) {
  const flattened = {};

  Object.entries(parameters).forEach(([group, groupParameters]) => {
    flattened[group] = flattenParameterGroup(groupParameters);
  });

  return flattened;
}

/**
 * Flattens parameters for use in the API request body
 * @param parameters
 * @returns {{}}
 */
export function flattenParameters(parameters) {
  let flattened = {};
  const { pipeline, job } = parameters;

  if (pipeline) {
    flattened = flattenParameterGroup(pipeline);
  }

  if (job) {
    flattened = { ...flattened, ...flattenJobParameters(job) };
  }

  return flattened;
}
