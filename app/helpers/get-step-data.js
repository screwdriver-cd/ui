import { helper } from '@ember/component/helper';
import { get } from '@ember/object';

/**
 * Get the step data for a given step name and build
 * @method getStepData
 * @param  {Array}    buildSteps  The build model
 * @param  {String}    step   The step name
 * @param  {String}    field  The step field name
 * @return {String}
 */
export function getStepData([buildSteps, step, field]) {
  if (!step) {
    return null;
  }

  const data = buildSteps.find(s => s.name === step);

  if (field) {
    return get(data, field);
  }

  return data;
}

export default helper(getStepData);
