/**
 * convert value to Boolean
 * @method convertToBool
 * @param {(Boolean|String)} value
 * @return {Boolean}
 */
function convertToBool(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  // trueList refers to https://yaml.org/type/bool.html
  const trueList = ['on', 'true', 'yes', 'y'];
  const lowerValue = String(value).toLowerCase();

  return trueList.includes(lowerValue);
}

export { convertToBool as default };
