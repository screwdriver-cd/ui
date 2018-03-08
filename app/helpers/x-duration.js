import { helper } from '@ember/component/helper';

/**
 * Returns the "humanized" difference between two times
 * @method xDuration
 * @param  {Array}  times  List of 2 timestamps or other parseable time definitions
 * @return {String}        Duration string
 */
export function xDuration([time1, time2]) {
  if (!time1 || !time2) {
    return null;
  }

  let [t1, t2] = [new Date(time1), new Date(time2)];

  return humanizeDuration(t2.getTime() - t1.getTime(), { round: true, largest: 2 });
}

export default helper(xDuration);
