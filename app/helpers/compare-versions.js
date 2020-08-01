import { helper } from '@ember/component/helper';

/**
 * Compare version strings to find greater, equal or lesser
 * @param  {String}  v1  version
 * @param  {String}  v2  version
 * @return {Number} greater, equal, lesser
 */
export function compareVersions(v1, v2) {
  const s1 = v1.split('.');
  const s2 = v2.split('.');
  let i1;
  let i2;
  let limit = Math.max(s1.length, s2.length);

  while (limit) {
    limit -= 1;
    i1 = parseInt(s1.shift() || 0, 10);
    i2 = parseInt(s2.shift() || 0, 10);
    if (i1 !== i2) {
      break;
    }
  }

  if (i1 > i2) return 1;
  if (i1 < i2) return -1;

  return 0;
}

export default helper(compareVersions);
