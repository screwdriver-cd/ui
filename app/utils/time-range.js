/**
 * Returns start and end dates given time range and end date
 *
 * @export
 * @param {Date} end end date
 * @param {String} range duration string, e.g. '1hr', '1wk', '1mo' for now
 * @returns {Object} start and end dates of specific time range in ISO format, or null if unrecognize
 */
export default function timeRange(end, range) {
  const match = range.match(/(\d+)([^\d]+)/);

  if (!match) {
    return null;
  }

  let now = new Date(end);
  let startTime;

  const [, quantity, duration] = match;
  const endTime = now.toISOString().split('.')[0];

  switch (duration) {
  case 'hr':
    now.setUTCHours(now.getUTCHours() - +quantity);
    break;
  case 'd':
    now.setUTCDate(now.getUTCDate() - +quantity);
    break;
  case 'wk':
    now.setUTCDate(now.getUTCDate() - (+quantity * 7));
    break;
  case 'mo':
    now.setUTCMonth(now.getUTCMonth() - +quantity);
    break;
  default:
    return null;
  }

  startTime = now.toISOString().split('.')[0];

  return { startTime, endTime };
}
