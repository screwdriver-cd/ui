import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';
import { get } from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import ObjectProxy from '@ember/object/proxy';

const ObjectPromiseProxy = ObjectProxy.extend(PromiseProxyMixin);

export const TIMESTAMP_OPTIONS = [
  { value: 'LOCAL_TIMEZONE', name: 'Local Timezone' },
  { value: 'UTC', name: 'UTC' }
];

export const TIMESTAMP_DEFAULT_OPTION = 0;

/**
 * Return custom locale string for date
 * @export
 * @param {Object} userSettings  User settings
 * @param {String} startDate     Input date
 * @returns {String} custom locale string as per user preference
 */
export function getTimestamp(userSettings, startDate) {
  return ObjectPromiseProxy.create({
    promise: userSettings.getUserPreference().then(userPreference => {
      let timestamp = 'n/a';

      const timestampPreference = get(userPreference, 'timestampFormat');

      if (timestampPreference === 'UTC') {
        timestamp = `${toCustomLocaleString(new Date(startDate), {
          timeZone: 'UTC'
        })}`;
      } else {
        timestamp = `${toCustomLocaleString(new Date(startDate))}`;
      }

      return timestamp;
    })
  });
}
