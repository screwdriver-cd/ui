const getIcon = status => {
  switch (status) {
    case 'queued':
    case 'running':
      return 'refresh fa-spin';
    case 'success':
      return 'check-circle';
    case 'failure':
      return 'times-circle';
    case 'aborted':
      return 'stop-circle';
    case 'blocked':
      return 'ban';
    case 'unstable':
      return 'exclamation-circle';
    case 'frozen':
      return 'minus-circle';
    default:
      return 'question-circle';
  }
};

const getColor = status => {
  switch (status) {
    case 'queued':
    case 'running':
      return 'build-running';
    case 'success':
      return 'build-success';
    case 'failure':
      return 'build-failure';
    case 'aborted':
      return 'build-failure';
    case 'blocked':
      return 'build-running';
    case 'unstable':
      return 'build-unstable';
    case 'frozen':
      return 'build-frozen';
    default:
      return 'build-unknown';
  }
};

const formatTime = duration => {
  const numOfTotalSeconds = duration;
  const minute = 60;
  const hour = 60 * minute;

  if (numOfTotalSeconds === 0) {
    return '0s';
  }
  if (numOfTotalSeconds < minute) {
    return `${numOfTotalSeconds}s`;
  }
  if (numOfTotalSeconds < hour) {
    const numOfMinutes = Math.floor(numOfTotalSeconds / minute);
    const numOfSeconds = numOfTotalSeconds % minute;

    return `${numOfMinutes}m ${numOfSeconds}s`;
  }
  const numOfHours = Math.floor(numOfTotalSeconds / hour);
  const numOfMinutes = Math.floor((numOfTotalSeconds % hour) / minute);
  const numOfSeconds = Math.floor(numOfTotalSeconds % minute);

  return `${numOfHours}h ${numOfMinutes}m ${numOfSeconds}s`;
};

const getSha = sha => sha.substring(0, 7);

const formatMetrics = metrics => {
  if (!metrics || !metrics.length) {
    return {
      eventsInfo: [],
      lastEventInfo: {
        startTime: '--/--/----',
        statusColor: 'build-empty',
        durationText: '--',
        sha: 'Not available',
        icon: 'question-circle',
        commitMessage: 'No events have been run for this pipeline',
        commitUrl: '#'
      }
    };
  }

  const lastEvent = metrics.get('firstObject');
  const lastEventStartTime = new Date(lastEvent.createTime);
  const lastEventStartYear = lastEventStartTime.getFullYear();
  const lastEventStartMonth = (lastEventStartTime.getMonth() + 1).toString().padStart(2, '0');
  const lastEventStartDay = lastEventStartTime
    .getDate()
    .toString()
    .padStart(2, '0');

  const eventsInfo = metrics.map(event => ({
    duration: event.duration || 0,
    statusColor: getColor(event.status.toLowerCase())
  }));
  const lastEventInfo = {
    startTime: `${lastEventStartMonth}/${lastEventStartDay}/${lastEventStartYear}`,
    statusColor: getColor(lastEvent.status.toLowerCase()),
    durationText: lastEvent.duration ? formatTime(lastEvent.duration) : '--',
    sha: getSha(lastEvent.sha),
    icon: getIcon(lastEvent.status.toLowerCase()),
    commitMessage: lastEvent.commit.message,
    commitUrl: lastEvent.commit.url
  };

  return { eventsInfo, lastEventInfo };
};

export { getIcon, getColor, formatTime, getSha, formatMetrics };
