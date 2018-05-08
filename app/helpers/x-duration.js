import { helper } from '@ember/component/helper';

/**
 * Returns the difference between two times in 'HH:mm:ss' format
 * @method xDuration
 * @param  {Array}  times  List of 2 timestamps or other parseable time definitions
 * @return {String}        Duration string
 */
export function xDuration([time1, time2]) {
  if (!time1 || !time2) {
    return null;
  }

  const [t1, t2] = [new Date(time1), new Date(time2)];
  const diff = t2.getTime() - t1.getTime();

  return new Date(diff).toISOString().substr(11, 8);
}

export default helper(xDuration);
