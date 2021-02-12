const logback = `<a href="/login" target="_blank" rel="noopener">log back</a>`;

/**
 * Format templates to add fullName and humanized date
 * @param  {Array} Templates
 * @return {Array} Formatted templates
 */
const getErrorMessage = err => {
  let errorMessage = '';

  if (typeof err === 'object' && err !== null) {
    const { message = '' } = err;

    if (message.startsWith('The adapter operation was aborted')) {
      errorMessage = 'Action cannot be completed, please make sure you are online';
    }
  } else if (err === '401 Invalid token') {
    errorMessage = `Session timed-out, please ${logback} in to complete the action`;
  } else if (err === '0 Request Failed') {
    errorMessage = `Session timed-out, please ${logback} in to complete the action`;
  }

  return errorMessage;
};

export { getErrorMessage as default };
