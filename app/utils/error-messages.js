/**
 * Format templates to add fullName and humanized date
 * @param  {Array} Templates
 * @return {Array} Formatted templates
 */
const getErrorMessage = err => {
  let errorMessage = '';

  if (err === '401 Invalid token') {
    errorMessage = 'Session timed-out, please log back in to complete the action';
  } else if (err === '0 Request Failed') {
    errorMessage = 'Session timed-out, please log back in to complete the action';
  }

  return errorMessage;
};

export default { getErrorMessage };
