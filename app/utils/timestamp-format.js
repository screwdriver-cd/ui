import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export const TIMESTAMP_OPTIONS = [
  { value: 'LOCAL_TIMEZONE', name: 'Local Timezone' },
  { value: 'UTC', name: 'UTC' }
];

export const TIMESTAMP_DEFAULT_OPTION = 0;

/**
 * Return custom locale string for date
 * @export
 * @param {string} timestampPreference timestamp preferred e.g UTc
 * @param {string} startDate input date
 * @returns {String} custom locale string as per user preference
 */
export function getTimestamp(timestampPreference, startDate) {
  let timestamp = 'n/a';

  if (timestampPreference === 'UTC') {
    timestamp = `${toCustomLocaleString(new Date(startDate), {
      timeZone: 'UTC'
    })}`;
  } else {
    timestamp = `${toCustomLocaleString(new Date(startDate))}`;
  }

  return timestamp;
}
