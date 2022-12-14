import { get } from '@ember/object';

/**
 * this function sorts on the basis of status
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByLastRunStatus = (a, b) => {
  /**
   * This array has sorting priority order
   */
  const priorities = [
    'success',
    'running',
    'queued',
    'created',
    'unstable',
    'aborted',
    'collapsed',
    'frozen',
    'failure',
    'blocked'
  ];
  const aStatus = get(a, 'lastRunEvent.status');
  const bStatus = get(b, 'lastRunEvent.status');

  return priorities.indexOf(aStatus) - priorities.indexOf(bStatus);
};

/**
 * this function sorts on the basis of name
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByName = (a, b) => {
  const aName = get(a, 'scmRepo.name');
  const bName = get(b, 'scmRepo.name');

  if (aName > bName) {
    return 1;
  }
  if (aName < bName) {
    return -1;
  }

  return 0;
};

/**
 * this function sorts on the basis of last run
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByLastRun = (a, b) => {
  const aCreateTime = get(a, 'lastRunEvent.createTime');
  const bCreateTime = get(b, 'lastRunEvent.createTime');

  return new Date(aCreateTime) - new Date(bCreateTime);
};

/**
 * this function sorts on the basis of history
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByHistory = (a, b) => {
  const aFailedBuildCount = get(a, 'failedBuildCount');
  const bFailedBuildCount = get(b, 'failedBuildCount');

  return aFailedBuildCount - bFailedBuildCount;
};

/**
 * this function sorts on the basis of branch
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByBranch = (a, b) => {
  return a.scmRepo.branch - b.scmRepo.branch;
};

/**
 * this function sorts on the basis of duration
 * @param  {Object}  pipeline object
 * @param {Object}  pipeline object
 * @return {Array} sorted pipeline arrray
 */
export const sortByDuration = (a, b) => {
  const aDuration = get(a, 'lastRunEvent.duration');
  const bDuration = get(b, 'lastRunEvent.duration');

  return aDuration - bDuration;
};
