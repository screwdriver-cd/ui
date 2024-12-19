import moment from 'moment';

const getIcon = status => {
  switch (status) {
    case 'queued':
    case 'running':
      return 'refresh fa-spin';
    case 'success':
    case 'warning':
      return 'circle-check';
    case 'failure':
      return 'circle-xmark';
    case 'aborted':
      return 'circle-stop';
    case 'blocked':
      return 'ban';
    case 'unstable':
      return 'circle-exclamation';
    case 'frozen':
      return 'circle-minus';
    default:
      return 'circle-question';
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
    case 'warning':
      return 'build-warning';
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
        status: 'build-empty',
        durationText: '--',
        sha: 'Not available',
        icon: 'circle-question',
        commitMessage: 'No events have been run for this pipeline',
        commitUrl: '#',
        createTime: 0,
        duration: 0
      }
    };
  }

  const lastEvent = metrics.get('firstObject');
  const lastEventStartTime = new Date(lastEvent.createTime);
  const lastEventStartYear = lastEventStartTime.getFullYear();
  const lastEventStartMonth = (lastEventStartTime.getMonth() + 1)
    .toString()
    .padStart(2, '0');
  const lastEventStartDay = lastEventStartTime
    .getDate()
    .toString()
    .padStart(2, '0');

  const eventsInfo = metrics.map(event => {
    let eventStatus = event.status.toLowerCase();

    // only overwrite success event with warning
    if (event && event.builds && eventStatus === 'success') {
      event.builds.forEach(build => {
        if (build?.meta?.build?.warning) {
          eventStatus = 'warning';
        }
      });
    }

    return {
      duration: event.duration || 0,
      statusColor: getColor(eventStatus)
    };
  });

  let lastEventStatus = lastEvent.status.toLowerCase();

  // only overwrite success event with warning
  if (lastEvent && lastEvent.builds && lastEventStatus === 'success') {
    lastEvent.builds.forEach(build => {
      if (build?.meta?.build?.warning) {
        lastEventStatus = 'warning';
      }
    });
  }

  const lastEventInfo = {
    startTime: `${lastEventStartMonth}/${lastEventStartDay}/${lastEventStartYear}`,
    statusColor: getColor(lastEventStatus),
    status: lastEvent.status.toLowerCase(),
    durationText: lastEvent.duration ? formatTime(lastEvent.duration) : '--',
    sha: getSha(lastEvent.sha),
    icon: getIcon(lastEvent.status.toLowerCase()),
    commitMessage: lastEvent.commit.message,
    commitUrl: lastEvent.commit.url,
    createTime: moment(lastEvent.createTime).format(),
    duration: lastEvent.duration || 0
  };

  return { eventsInfo, lastEventInfo };
};

export { getIcon, getColor, formatTime, getSha, formatMetrics };
