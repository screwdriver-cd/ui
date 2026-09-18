/**
 * Construct the template's full name (e.g.: namespace/myTemplate)
 * @method getFullName
 * @param  {Object}       config
 * @param  {String}       config.name       Template name
 * @param  {String}       config.namespace  Template namespace
 * @return {String}                         Returns the template full name
 */
const getFullName = config => {
  const { name, namespace } = config;

  let fullName = name;

  if (namespace && namespace !== 'default') {
    fullName = `${namespace}/${name}`;
  }

  return fullName;
};

/**
 * Get the humanized last update time
 * @param  {Object} config
 * @param  {String} config.updateTime   Template create time
 * @return {String}                     Returns humanized last update time
 */
const getLastUpdatedTime = ({ updateTime }) => {
  if (!updateTime) {
    return null;
  }

  const timeDiff = Date.now() - new Date(updateTime).getTime();
  const lastUpdated = `${humanizeDuration(timeDiff, {
    round: true,
    largest: 1
  })} ago`;

  return lastUpdated;
};

/**
 * Format templates to add fullName and humanized date
 * @param  {Array} Templates
 * @return {Array} Formatted templates
 */
const templatesFormatter = templates => {
  templates.forEach(t => {
    // Add full template name
    t.fullName = getFullName({
      name: t.name,
      namespace: t.namespace
    });

    // Add last updated time
    if (t.updateTime) {
      t.lastUpdated = getLastUpdatedTime({ updateTime: t.updateTime });
    } else if (t.createTime) {
      // Using createTime if it does not have updateTime (job template)
      t.lastUpdated = getLastUpdatedTime({ updateTime: t.createTime });
    }

    if (!t.description) {
      t.description = '';
    }
  });

  return templates;
};

export default { getFullName, getLastUpdatedTime, templatesFormatter };
