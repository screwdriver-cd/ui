import { get } from '@ember/object';

export const sortByLastRunStatus = (a, b) => {
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

export const sortByLastRun = (a, b) => {
  const aCreateTime = get(a, 'lastRunEvent.createTime');
  const bCreateTime = get(b, 'lastRunEvent.createTime');

  return new Date(aCreateTime) - new Date(bCreateTime);
};

export const sortByHistory = (a, b) => {
  const aFailedBuildCount = get(a, 'failedBuildCount');
  const bFailedBuildCount = get(b, 'failedBuildCount');

  return aFailedBuildCount - bFailedBuildCount;
};

export const sortByBranch = (a, b) => {
  return a.scmRepo.branch - b.scmRepo.branch;
};

export const sortByDuration = (a, b) => {
  const aDuration = get(a, 'lastRunEvent.duration');
  const bDuration = get(b, 'lastRunEvent.duration');

  return aDuration - bDuration;
};
