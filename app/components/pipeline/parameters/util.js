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
