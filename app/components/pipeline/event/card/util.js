import humanizeDuration from 'humanize-duration';
import { toCustomLocaleString } from 'screwdriver-ui/utils/time-range';

export const getTruncatedSha = event => {
  return event.sha.slice(0, 7);
};

export const getTruncatedMessage = (event, length) => {
  const commitMessage = event.commit.message;

  return commitMessage.length > length
    ? `${commitMessage.substring(0, length)}...`
    : commitMessage;
};

export const getStartDate = (event, userSettings) => {
  const startDate = event.createTime;
  const timestampPreference = userSettings.timestampFormat;

  if (timestampPreference === 'UTC') {
    return `${toCustomLocaleString(new Date(startDate), {
      timeZone: 'UTC'
    })}`;
  }

  return `${toCustomLocaleString(new Date(startDate))}`;
};

export const getDuration = builds => {
  const firstCreateTime = builds
    .map(build => {
      return new Date(build.createTime);
    })
    .sort()[0];

  const lastEndTime = builds
    .map(build => {
      return new Date(build.endTime);
    })
    .sort()
    .pop();

  if (!firstCreateTime || !lastEndTime) {
    return 0;
  }

  return lastEndTime.getTime() - firstCreateTime.getTime();
};

export const getDurationText = builds => {
  const shortEnglishHumanizer = humanizeDuration.humanizer({
    language: 'shortEn',
    languages: {
      shortEn: {
        y: () => 'y',
        mo: () => 'mo',
        w: () => 'w',
        d: () => 'd',
        h: () => 'h',
        m: () => 'm',
        s: () => 's',
        ms: () => 'ms'
      }
    }
  });

  const buildsToUse = builds || [];

  return shortEnglishHumanizer(getDuration(buildsToUse), {
    round: true,
    largest: 1
  });
};

export const isExternalTrigger = event => {
  const { startFrom, pipelineId } = event;

  if (startFrom && startFrom.match(/^~sd@(\d+):([\w-]+)$/)) {
    const triggerPipelineId = startFrom.match(/^~sd@(\d+):([\w-]+)$/)[1];

    return Number(triggerPipelineId) !== pipelineId;
  }

  return false;
};

export const isCommitterDifferent = event => {
  const creatorName = event.creator.name;
  const authorName = event.commit.author.name;

  return isExternalTrigger(event) || creatorName !== authorName;
};

export const getExternalPipelineId = event => {
  const { startFrom } = event;
  const matches = startFrom.match(/^~sd@(\d+):([\w-]+)$/);

  return matches ? matches[1] : null;
};

export const getFailureCount = builds => {
  return builds.filter(
    build => build.status === 'FAILURE' || build.status === 'ABORTED'
  ).length;
};

export const getWarningCount = builds => {
  return builds.filter(build => build.status === 'UNSTABLE').length;
};