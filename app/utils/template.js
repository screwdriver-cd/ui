/**
 * Construct the template's full name (e.g.: namespace/myTemplate)
 * @method getFullName
 * @param  {Object}       config
 * @param  {String}       config.name       Template name
 * @param  {String}       config.namespace  Template namespace
 * @return {String}                         Returns the template full name
 */
const getFullName = (config) => {
  let { name, namespace } = config;
  let fullName = name;

  if (namespace && namespace !== 'default') {
    fullName = `${namespace}/${name}`;
  }

  return fullName;
};

/**
 * Get the humanized last update time
 * @param  {Object} config
 * @param  {String} config.createTime   Template create time
 * @return {String}                     Returns humanized last update time
 */
const getLastUpdatedTime = (config) => {
  let timeDiff = Date.now() - new Date(config.createTime).getTime();
  const lastUpdated = `${humanizeDuration(timeDiff, { round: true, largest: 1 })} ago`;

  return lastUpdated;
};

export default { getFullName, getLastUpdatedTime };
