const build = {
  id: 1234,
  jobId: 1,
  number: 1474649580274,
  container: 'node:6',
  cause: 'Started by user batman',
  sha: 'c96f36886e084d18bd068b8156d095cd9b31e1d6',
  createTime: '2016-09-23T16:53:00.274Z',
  startTime: '2016-09-23T16:53:08.601Z',
  endTime: '2016-09-23T16:58:47.355Z',
  meta: {},
  steps: [
    {
      startTime: '2016-09-23T16:53:07.497654442Z',
      name: 'sd-setup',
      code: 0,
      endTime: '2016-09-23T16:53:12.46806858Z'
    },
    {
      startTime: '2016-09-23T16:53:12.902784483Z',
      name: 'install',
      code: 137,
      endTime: '2016-09-23T16:58:46.924844475Z'
    },
    {
      name: 'bower'
    },
    {
      name: 'test'
    }
  ],
  status: 'FAILURE'
};

// eslint-disable-next-line import/prefer-default-export
export const makeBuilds = eventId => {
  const builds = [];
  const shas = [
    'abcd1234567890',
    'bcd1234567890a',
    'cd1234567890ab',
    'd1234567890abc',
    '1234567890abcd'
  ];

  shas.forEach(sha => {
    const config = {
      id: Math.floor(Math.random() * 99999999999),
      eventId,
      sha,
      number: Date.now(),
      status: ['SUCCESS', 'FAILURE', 'RUNNING'][Math.floor(Math.random() * 2)]
    };

    builds.push({ ...build, ...config });
  });

  return builds;
};
