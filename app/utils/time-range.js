/**
 *
 *
 * @export
 * @param {Date} date date object
 * @returns {String} ISO 8601 format up to the minute at most, total 16 characters
 */
export function iso8601UpToMinute(date) {
  const d = new Date(date).toISOString();

  return d.substring(0, d.lastIndexOf(':'));
}

/**
 * Return custom locale string for date
 *
 * @export
 * @param {Date} date input date
 * @param {String} [config.timeZone] targeted time zone, e.g. UTC, America/Los_Angeles
 * @param {Object} [config.options] other options for display format
 * @returns {String} custom locale string
 */
export function toCustomLocaleString(
  date,
  {
    timeZone,
    options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  } = {}
) {
  const tz = timeZone && timeZone.trim();

  if (tz) {
    options.timeZone = tz;
    options.timeZoneName = 'short';

    return date.toLocaleString('en-US', options);
  }
  // eslint-disable-next-line new-cap
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  options.timeZone = userTimeZone;
  options.timeZoneName = 'short';

  return date.toLocaleString('en-US', options);
}

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

  const current = new Date(end);

  let startTime;

  let [, quantity, duration] = match;

  quantity = +quantity;

  const endTime = iso8601UpToMinute(current);

  switch (duration) {
    case 'hr':
      current.setUTCHours(current.getUTCHours() - quantity);
      break;
    case 'd':
      current.setUTCDate(current.getUTCDate() - quantity);
      break;
    case 'wk':
      current.setUTCDate(current.getUTCDate() - quantity * 7);
      break;
    case 'mo':
      current.setUTCMonth(current.getUTCMonth() - quantity);
      break;
    case 'yr':
      current.setUTCFullYear(current.getUTCFullYear() - quantity);
      break;
    default:
      return null;
  }

  startTime = iso8601UpToMinute(current);

  return { startTime, endTime };
}

export const CONSTANT = {
  WEEK: 60 * 60 * 24 * 7 * 1e3,
  MONTH: 60 * 60 * 24 * 30 * 1e3,
  SEMI_YEAR: 60 * 60 * 24 * 30 * 6 * 1e3,
  YEAR: 60 * 60 * 24 * 365 * 1e3
};
