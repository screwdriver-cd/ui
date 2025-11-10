import { copy } from 'ember-copy';
import { Promise as EmberPromise } from 'rsvp';

export const mockMetrics = [
  {
    id: 71767,
    createTime: '2019-03-12T01:09:55.973Z',
    causeMessage: 'Merged by DekusDenial',
    sha: '3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
    url: 'https://github.com/screwdriver-cd/ui/commit/3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
    queuedTime: 11,
    imagePullTime: 21,
    duration: 1144,
    status: 'SUCCESS',
    builds: [
      {
        id: 99335,
        jobId: 158,
        eventId: 71767,
        createTime: '2019-03-12T01:24:10.173Z',
        startTime: '2019-03-12T01:24:19.388Z',
        endTime: '2019-03-12T01:29:11.231Z',
        duration: 292,
        status: 'SUCCESS',
        queuedTime: 2,
        imagePullTime: 8
      },
      {
        id: 99334,
        jobId: 157,
        eventId: 71767,
        createTime: '2019-03-12T01:18:28.063Z',
        startTime: '2019-03-12T01:18:39.806Z',
        endTime: '2019-03-12T01:24:04.219Z',
        duration: 324,
        status: 'SUCCESS',
        queuedTime: 4,
        imagePullTime: 7
      },
      {
        id: 99331,
        jobId: 156,
        eventId: 71767,
        createTime: '2019-03-12T01:09:56.354Z',
        startTime: '2019-03-12T01:10:07.408Z',
        endTime: '2019-03-12T01:18:26.479Z',
        duration: 499,
        status: 'SUCCESS',
        queuedTime: 5,
        imagePullTime: 6
      }
    ]
  },
  {
    id: 71900,
    createTime: '2019-03-12T12:29:29.922Z',
    causeMessage: 'Merged by DekusDenial',
    sha: 'e6c90056bb11e52d94e74dcc9eae7d17ce8eb290',
    url: 'https://github.com/screwdriver-cd/ui/commit/e6c90056bb11e52d94e74dcc9eae7d17ce8eb290',
    queuedTime: 14,
    imagePullTime: 20,
    duration: 1002,
    status: 'SUCCESS',
    builds: [
      {
        id: 99596,
        jobId: 158,
        eventId: 71900,
        createTime: '2019-03-12T12:43:15.229Z',
        startTime: '2019-03-12T12:43:27.707Z',
        endTime: '2019-03-12T12:46:23.926Z',
        duration: 176,
        status: 'SUCCESS',
        queuedTime: 5,
        imagePullTime: 7
      },
      {
        id: 99595,
        jobId: 157,
        eventId: 71900,
        createTime: '2019-03-12T12:37:45.031Z',
        startTime: '2019-03-12T12:37:56.605Z',
        endTime: '2019-03-12T12:43:13.990Z',
        duration: 317,
        status: 'SUCCESS',
        queuedTime: 5,
        imagePullTime: 6
      },
      {
        id: 99594,
        jobId: 156,
        eventId: 71900,
        createTime: '2019-03-12T12:29:30.300Z',
        startTime: '2019-03-12T12:29:42.193Z',
        endTime: '2019-03-12T12:37:43.721Z',
        duration: 482,
        status: 'SUCCESS',
        queuedTime: 4,
        imagePullTime: 7
      }
    ]
  },
  {
    id: 72148,
    createTime: '2019-03-13T22:23:18.712Z',
    causeMessage: 'Merged by DekusDenial',
    sha: '91f45d077bacd52d13a7d5f76f2717f9fbec61b4',
    url: 'https://github.com/screwdriver-cd/ui/commit/91f45d077bacd52d13a7d5f76f2717f9fbec61b4',
    queuedTime: 15,
    imagePullTime: 29,
    duration: 1073,
    status: 'SUCCESS',
    builds: [
      {
        id: 100115,
        jobId: 159,
        eventId: 72148,
        createTime: '2019-03-13T22:40:23.335Z',
        startTime: '2019-03-13T22:40:31.848Z',
        endTime: '2019-03-13T22:41:23.210Z',
        duration: 51,
        status: 'SUCCESS',
        queuedTime: 1,
        imagePullTime: 7
      },
      {
        id: 100114,
        jobId: 158,
        eventId: 72148,
        createTime: '2019-03-13T22:37:06.616Z',
        startTime: '2019-03-13T22:37:17.501Z',
        endTime: '2019-03-13T22:40:21.885Z',
        duration: 184,
        status: 'SUCCESS',
        queuedTime: 4,
        imagePullTime: 7
      },
      {
        id: 100113,
        jobId: 157,
        eventId: 72148,
        createTime: '2019-03-13T22:31:33.160Z',
        startTime: '2019-03-13T22:31:46.869Z',
        endTime: '2019-03-13T22:37:05.444Z',
        duration: 319,
        status: 'SUCCESS',
        queuedTime: 6,
        imagePullTime: 8
      },
      {
        id: 100109,
        jobId: 156,
        eventId: 72148,
        createTime: '2019-03-13T22:23:19.049Z',
        startTime: '2019-03-13T22:23:30.100Z',
        endTime: '2019-03-13T22:31:31.856Z',
        duration: 482,
        status: 'SUCCESS',
        queuedTime: 4,
        imagePullTime: 7
      }
    ]
  },
  {
    id: 72817,
    createTime: '2019-03-15T21:07:33.358Z',
    causeMessage: 'Merged by jithin1987',
    sha: '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c',
    url: 'https://github.com/screwdriver-cd/ui/commit/7650a8e64acc96a5de83b42c2e2f6de6223b9f1c',
    queuedTime: 27,
    imagePullTime: 30,
    duration: 2070,
    status: 'SUCCESS',
    builds: [
      {
        id: 101329,
        jobId: 159,
        eventId: 72817,
        createTime: '2019-03-15T21:41:08.641Z',
        startTime: '2019-03-15T21:41:22.231Z',
        endTime: '2019-03-15T21:42:13.264Z',
        duration: 51,
        status: 'SUCCESS',
        queuedTime: 5,
        imagePullTime: 8
      },
      {
        id: 101320,
        jobId: 158,
        eventId: 72817,
        createTime: '2019-03-15T21:21:40.972Z',
        startTime: '2019-03-15T21:22:02.303Z',
        endTime: '2019-03-15T21:41:07.039Z',
        duration: 1145,
        status: 'SUCCESS',
        queuedTime: 14,
        imagePullTime: 7
      },
      {
        id: 101314,
        jobId: 157,
        eventId: 72817,
        createTime: '2019-03-15T21:16:13.163Z',
        startTime: '2019-03-15T21:16:26.827Z',
        endTime: '2019-03-15T21:21:40.019Z',
        duration: 313,
        status: 'SUCCESS',
        queuedTime: 6,
        imagePullTime: 8
      },
      {
        id: 101306,
        jobId: 156,
        eventId: 72817,
        createTime: '2019-03-15T21:07:33.723Z',
        startTime: '2019-03-15T21:07:43.185Z',
        endTime: '2019-03-15T21:16:11.987Z',
        duration: 509,
        status: 'SUCCESS',
        queuedTime: 2,
        imagePullTime: 7
      }
    ]
  }
];
/**
 * Return a promise based metrics mock
 *
 * @returns Promise
 */
export function mockMetricsPromise() {
  return new EmberPromise(resolve =>
    resolve(
      copy(
        [
          {
            id: 631630,
            createTime: '2021-05-21T18:54:43.093Z',
            causeMessage: 'Manually started by adong',
            sha: 'fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9',
            commit: {
              author: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              committer: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              message: 'update',
              url: 'https://github.com/adong/sd-pipeline1/commit/fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9'
            },
            duration: 3,
            queuedTime: 1,
            imagePullTime: 7,
            status: 'SUCCESS',
            builds: [
              {
                id: 707350,
                jobId: 34625,
                eventId: 631630,
                createTime: '2021-05-21T18:54:43.281Z',
                startTime: '2021-05-21T18:54:52.177Z',
                endTime: '2021-05-21T18:54:55.310Z',
                duration: 3,
                status: 'SUCCESS',
                queuedTime: 1,
                imagePullTime: 7
              }
            ],
            isDowntimeEvent: false,
            maxEndTime: '2021-05-21T18:54:55.310Z'
          },
          {
            id: 628914,
            createTime: '2021-05-06T06:05:11.070Z',
            causeMessage: 'Manually started by adong',
            sha: 'fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9',
            commit: {
              author: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              committer: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              message: 'update',
              url: 'https://github.com/adong/sd-pipeline1/commit/fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9'
            },
            duration: 3,
            queuedTime: 2,
            imagePullTime: 7,
            status: 'SUCCESS',
            builds: [
              {
                id: 703324,
                jobId: 34625,
                eventId: 628914,
                createTime: '2021-05-06T06:05:11.265Z',
                startTime: '2021-05-06T06:05:20.802Z',
                endTime: '2021-05-06T06:05:24.401Z',
                duration: 3,
                status: 'SUCCESS',
                queuedTime: 2,
                imagePullTime: 7
              }
            ],
            isDowntimeEvent: false,
            maxEndTime: '2021-05-06T06:05:24.401Z'
          },
          {
            id: 628913,
            createTime: '2021-05-06T06:02:48.436Z',
            causeMessage: 'Manually started by adong',
            sha: 'fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9',
            commit: {
              author: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              committer: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              message: 'update',
              url: 'https://github.com/adong/sd-pipeline1/commit/fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9'
            },
            duration: null,
            queuedTime: 4,
            imagePullTime: 0,
            status: 'ABORTED',
            builds: [
              {
                id: 703323,
                jobId: 34625,
                eventId: 628913,
                createTime: '2021-05-06T06:02:48.638Z',
                duration: null,
                status: 'ABORTED',
                queuedTime: 4,
                imagePullTime: null
              }
            ],
            isDowntimeEvent: false,
            maxEndTime: null
          },
          {
            id: 621172,
            createTime: '2021-03-30T02:44:20.219Z',
            causeMessage: 'Manually started by adong',
            sha: 'fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9',
            commit: {
              author: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              committer: {
                avatar: 'https://cd.screwdriver.cd/assets/unknown_user.png',
                name: 'Alan Dong',
                username: 'n/a',
                url: 'https://cd.screwdriver.cd/'
              },
              message: 'update',
              url: 'https://github.com/adong/sd-pipeline1/commit/fb3d95d9f73190c1e2eb9561e3c5579f5146c0c9'
            },
            duration: 3,
            queuedTime: 1,
            imagePullTime: 5,
            status: 'SUCCESS',
            builds: [
              {
                id: 691444,
                jobId: 34625,
                eventId: 621172,
                createTime: '2021-03-30T02:44:20.403Z',
                startTime: '2021-03-30T02:44:27.954Z',
                endTime: '2021-03-30T02:44:31.180Z',
                duration: 3,
                status: 'SUCCESS',
                queuedTime: 1,
                imagePullTime: 5
              }
            ],
            isDowntimeEvent: false,
            maxEndTime: '2021-03-30T02:44:31.180Z'
          }
        ],
        true
      )
    )
  );
}

/**
 * Return mock model for metrics
 *
 * @export
 * @returns
 */
export function model() {
  return copy(
    {
      startTime: '2019-03-25T01:00',
      endTime: '2019-03-26T17:01:19',
      successOnly: false,
      jobId: '156',
      metrics: {
        events: {
          queuedTime: [0.18333333333333332, 0.23333333333333334, 0.25, 0.45],
          imagePullTime: [0.35, 0.3333333333333333, 0.48333333333333334, 0.5],
          duration: [19.066666666666666, 16.7, 17.883333333333333, 34.5],
          total: [19.6, 17.266666666666666, 18.616666666666667, 35.45],
          sha: [
            '3deb58c4059220c9e5ae92f3ccd1609aa36e47e7',
            'e6c90056bb11e52d94e74dcc9eae7d17ce8eb290',
            '91f45d077bacd52d13a7d5f76f2717f9fbec61b4',
            '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c'
          ],
          status: ['SUCCESS', 'SUCCESS', 'SUCCESS', 'SUCCESS'],
          createTime: [
            '2019-03-12T01:09:55.973Z',
            '2019-03-12T12:29:29.922Z',
            '2019-03-13T22:23:18.712Z',
            '2019-03-15T21:07:33.358Z'
          ]
        },
        builds: [
          {
            beta: 4.866666666666666,
            publish: 5.4,
            main: 8.316666666666666
          },
          {
            beta: 2.933333333333333,
            publish: 5.283333333333333,
            main: 8.033333333333333
          },
          {
            prod: 0.85,
            beta: 3.066666666666667,
            publish: 5.316666666666666,
            main: 8.033333333333333
          },
          {
            prod: 0.85,
            beta: 19.083333333333332,
            publish: 5.216666666666667,
            main: 8.483333333333333
          }
        ],
        jobMap: {
          main: '156',
          publish: '157',
          beta: '158',
          prod: '159'
        },
        steps: {
          sha: [
            'e6c90056bb11e52d94e74dcc9eae7d17ce8eb290',
            '91f45d077bacd52d13a7d5f76f2717f9fbec61b4',
            '7650a8e64acc96a5de83b42c2e2f6de6223b9f1c'
          ],
          status: ['SUCCESS', 'SUCCESS', 'SUCCESS'],
          createTime: [
            '2019-03-12T12:29:29.922Z',
            '2019-03-13T22:23:18.712Z',
            '2019-03-15T21:07:33.358Z'
          ],
          data: [
            {
              'sd-setup-init': 0.6333333333333333,
              'sd-setup-launcher': 0,
              'sd-setup-scm': 0.03333333333333333,
              'sd-setup-screwdriver-cache-bookend': 0.18333333333333332,
              install: 1.2,
              'install-browsers': 0.75,
              test: 4.6,
              'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
              'sd-teardown-screwdriver-artifact-bookend': 0.016666666666666666,
              'sd-teardown-screwdriver-cache-bookend': 0.2
            },
            {
              'sd-setup-init': 0.25,
              'sd-setup-launcher': 0,
              'sd-setup-scm': 0.03333333333333333,
              'sd-setup-screwdriver-cache-bookend': 0.2,
              install: 1.1666666666666667,
              'install-browsers': 0.7333333333333333,
              test: 4.583333333333333,
              'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
              'sd-teardown-screwdriver-artifact-bookend': 0.03333333333333333,
              'sd-teardown-screwdriver-cache-bookend': 0.21666666666666667
            },
            {
              'sd-setup-init': 0.2,
              'sd-setup-launcher': 0,
              'sd-setup-scm': 0.016666666666666666,
              'sd-setup-screwdriver-cache-bookend': 0.18333333333333332,
              install: 1.1666666666666667,
              'install-browsers': 0.75,
              test: 4.7,
              'sd-teardown-screwdriver-coverage-bookend': 1.1833333333333333,
              'sd-teardown-screwdriver-artifact-bookend': 0.016666666666666666,
              'sd-teardown-screwdriver-cache-bookend': 0.18333333333333332
            }
          ]
        },
        stepGroup: [
          'install',
          'install-browsers',
          'sd-setup-init',
          'sd-setup-launcher',
          'sd-setup-scm',
          'sd-setup-screwdriver-cache-bookend',
          'sd-teardown-screwdriver-artifact-bookend',
          'sd-teardown-screwdriver-cache-bookend',
          'sd-teardown-screwdriver-coverage-bookend',
          'test'
        ],
        measures: {
          total: 4,
          passed: 4,
          failed: 0,
          avgs: {
            queuedTime: '17 seconds',
            imagePullTime: '25 seconds',
            duration: '22 minutes, 2 seconds'
          }
        }
      }
    },
    true
  );
}
