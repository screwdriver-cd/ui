import Component from '@ember/component';
import { computed } from '@ember/object';
import { htmlSafe } from '@ember/string';
import { inject as service } from '@ember/service';

export default Component.extend({
  pipelineName: '',
  noResult: true,
  isLoading: false,
  collaspe: false,
  selectedPipeline: undefined,
  // pipelines: [],
  pipelines: [
    {
      id: 3709,
      name: 'adong/artifacts-test',
      scmUri: 'github.com:226168338:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/artifacts-test',
        url: 'https://github.com/adong/artifacts-test/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2019-12-08T02:39:42.025Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 19716
          },
          {
            name: 'something',
            id: 21206
          }
        ],
        edges: [
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: '~pr',
            dest: 'something'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 633399,
      prChain: false,
      parameters: {},
      settings: {}
    },
    {
      id: 3066,
      name: 'adong/denali-css',
      scmUri: 'github.com:202014637:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/denali-css',
        url: 'https://github.com/adong/denali-css/tree/master',
        rootDir: ''
      },
      createTime: '2019-08-12T21:55:23.608Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 16309
          },
          {
            name: 'publish',
            id: 16311
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: 'main',
            dest: 'publish'
          }
        ]
      },
      annotations: {},
      lastEventId: 93151,
      prChain: false
    },
    {
      id: 5870,
      name: 'adong/freezewindow',
      scmUri: 'github.com:299200773:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/freezewindow',
        url: 'https://github.com/adong/freezewindow/tree/master',
        rootDir: ''
      },
      createTime: '2020-09-28T05:43:17.603Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'test',
            id: 34628
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'test'
          },
          {
            src: '~commit',
            dest: 'test'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 625986,
      prChain: false,
      parameters: {}
    },
    {
      id: 3075,
      name: 'adong/meta-cli-sd',
      scmUri: 'github.com:203837793:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/meta-cli-sd',
        url: 'https://github.com/adong/meta-cli-sd/tree/master',
        rootDir: ''
      },
      createTime: '2019-08-22T18:46:02.211Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'meta-set',
            id: 16379
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'meta-set'
          },
          {
            src: '~commit',
            dest: 'meta-set'
          }
        ]
      },
      annotations: {},
      lastEventId: 93272,
      prChain: false
    },
    {
      id: 3062,
      name: 'adong/screwdriver',
      scmUri: 'github.com:193960229:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver',
        url: 'https://github.com/adong/screwdriver/tree/master',
        rootDir: ''
      },
      createTime: '2019-07-26T17:35:42.410Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 16216
          },
          {
            name: '~sd@73:publish',
            id: 389
          },
          {
            name: 'publish',
            id: 16217
          },
          {
            name: 'beta',
            id: 16218
          },
          {
            name: 'prod',
            id: 16219
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: '~sd@73:publish',
            dest: 'main'
          },
          {
            src: 'main',
            dest: 'publish'
          },
          {
            src: 'publish',
            dest: 'beta'
          },
          {
            src: 'beta',
            dest: 'prod'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 599850,
      prChain: false,
      parameters: {}
    },
    {
      id: 6021,
      name: 'adong/screwdriver-email-notification',
      scmUri: 'github.com:306540763:main',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'main',
        name: 'adong/screwdriver-email-notification',
        url: 'https://github.com/adong/screwdriver-email-notification/tree/main',
        rootDir: ''
      },
      createTime: '2020-10-23T06:17:50.973Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 35695
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 532068,
      prChain: false,
      parameters: {}
    },
    {
      id: 7290,
      name: 'adong/screwdriver-label',
      scmUri: 'github.com:364799216:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-label',
        url: 'https://github.com/adong/screwdriver-label/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2021-05-06T05:55:59.897Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'A',
            id: 48487
          },
          {
            name: 'B',
            id: 48488
          },
          {
            name: 'C',
            id: 48489
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'A'
          },
          {
            src: '~commit',
            dest: 'A'
          },
          {
            src: '~pr',
            dest: 'B'
          },
          {
            src: '~commit',
            dest: 'B'
          },
          {
            src: 'A',
            dest: 'C'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 632242,
      prChain: false,
      parameters: {}
    },
    {
      id: 3146,
      name: 'adong/screwdriver-parameters-build',
      scmUri: 'github.com:208891468:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-parameters-build',
        url: 'https://github.com/adong/screwdriver-parameters-build/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2019-09-16T20:31:11.121Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 16716
          },
          {
            name: '~pr:/.*/'
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: '~pr:/.*/',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 632454,
      prChain: false
    },
    {
      id: 3303,
      name: 'adong/screwdriver-parameters-top-build',
      scmUri: 'github.com:210457339:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-parameters-top-build',
        url: 'https://github.com/adong/screwdriver-parameters-top-build/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2019-10-07T20:24:51.785Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 17364
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 632472,
      prChain: false,
      parameters: {
        _started_at: 'simple',
        user: {
          value: 'adong',
          description: 'User running build'
        }
      }
    },
    {
      id: 3399,
      name: 'adong/screwdriver-parameters-top-build-3-params',
      scmUri: 'github.com:215167155:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-parameters-top-build-3-params',
        url: 'https://github.com/adong/screwdriver-parameters-top-build-3-params/tree/master',
        rootDir: ''
      },
      createTime: '2019-10-25T20:15:27.828Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 17891
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 105144,
      prChain: false,
      parameters: {
        p1: 'p1',
        p2: {
          value: 'adong',
          description: 'User running build'
        }
      }
    },
    {
      id: 3400,
      name: 'adong/screwdriver-parameters-top-build-6-params',
      scmUri: 'github.com:215167138:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-parameters-top-build-6-params',
        url: 'https://github.com/adong/screwdriver-parameters-top-build-6-params/tree/master',
        rootDir: ''
      },
      createTime: '2019-10-25T20:32:19.975Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 17892
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 335907,
      prChain: false,
      parameters: {
        p1: 'p1',
        p2: {
          value: 'p2',
          description: 'User running build'
        },
        p3: {
          value: 'p3',
          description: 'this is a value for p3'
        },
        p4: 'p4',
        p5: 'p5',
        p6: {
          value: 'p6',
          description: 'this is a value for p6'
        }
      }
    },
    {
      id: 7308,
      name: 'adong/screwdriver-private-repo',
      scmUri: 'github.com:366847764:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/screwdriver-private-repo',
        url: 'https://github.com/adong/screwdriver-private-repo/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2021-05-12T20:41:44.291Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'A',
            id: 48974
          },
          {
            name: 'B',
            id: 48975
          },
          {
            name: 'C',
            id: 48976
          },
          {
            name: 'D',
            id: 48977
          },
          {
            name: 'E',
            id: 48978
          },
          {
            name: 'F',
            id: 48982
          },
          {
            name: 'G',
            id: 48980
          },
          {
            name: 'H',
            id: 48981
          },
          {
            name: 'I',
            id: 48979
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'A'
          },
          {
            src: '~commit',
            dest: 'A'
          },
          {
            src: '~pr',
            dest: 'B'
          },
          {
            src: '~commit',
            dest: 'B'
          },
          {
            src: 'A',
            dest: 'C'
          },
          {
            src: 'C',
            dest: 'D'
          },
          {
            src: 'D',
            dest: 'E'
          },
          {
            src: 'A',
            dest: 'F'
          },
          {
            src: 'A',
            dest: 'G'
          },
          {
            src: 'A',
            dest: 'H'
          },
          {
            src: 'A',
            dest: 'I',
            join: true
          },
          {
            src: 'H',
            dest: 'I',
            join: true
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 630052,
      prChain: false,
      parameters: {}
    },
    {
      id: 4045,
      name: 'adong/sd-20-jobs',
      scmUri: 'github.com:238042323:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-20-jobs',
        url: 'https://github.com/adong/sd-20-jobs/tree/master',
        rootDir: ''
      },
      createTime: '2020-02-03T19:23:08.129Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 21654
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 621167,
      prChain: false,
      parameters: {},
      settings: {
        metricsDowntimeJobs: [21654, 21983]
      }
    },
    {
      id: 4075,
      name: 'adong/sd-21-jobs',
      scmUri: 'github.com:238344127:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-21-jobs',
        url: 'https://github.com/adong/sd-21-jobs/tree/master',
        rootDir: ''
      },
      createTime: '2020-02-05T01:36:35.938Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 21840
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 106662,
      prChain: false,
      parameters: {}
    },
    {
      id: 6862,
      name: 'adong/sd-dummy-job',
      scmUri: 'github.com:221073580:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-dummy-job',
        url: 'https://github.com/adong/sd-dummy-job/tree/master',
        rootDir: ''
      },
      createTime: '2021-03-12T19:16:59.732Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'A',
            id: 43534
          },
          {
            name: 'B',
            id: 43536
          },
          {
            name: 'C',
            id: 43535
          },
          {
            name: 'D',
            id: 43537
          },
          {
            name: 'E',
            id: 43538
          },
          {
            name: 'F',
            id: 43539
          },
          {
            name: 'G',
            id: 43548
          },
          {
            name: 'H',
            id: 43549
          },
          {
            name: 'I',
            id: 43550
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'A'
          },
          {
            src: '~commit',
            dest: 'A'
          },
          {
            src: '~pr',
            dest: 'B'
          },
          {
            src: '~commit',
            dest: 'B'
          },
          {
            src: 'A',
            dest: 'C'
          },
          {
            src: 'C',
            dest: 'D'
          },
          {
            src: 'D',
            dest: 'E'
          },
          {
            src: 'A',
            dest: 'F'
          },
          {
            src: 'A',
            dest: 'G'
          },
          {
            src: 'A',
            dest: 'H'
          },
          {
            src: 'A',
            dest: 'I',
            join: true
          },
          {
            src: 'H',
            dest: 'I',
            join: true
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 621175,
      prChain: false,
      parameters: {}
    },
    {
      id: 5867,
      name: 'adong/sd-onboarding',
      scmUri: 'github.com:299141578:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-onboarding',
        url: 'https://github.com/adong/sd-onboarding/tree/master',
        rootDir: ''
      },
      createTime: '2020-09-28T00:12:57.980Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 34623
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 478625,
      prChain: false,
      parameters: {}
    },
    {
      id: 4929,
      name: 'adong/sd-open-pr',
      scmUri: 'github.com:268408364:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-open-pr',
        url: 'https://github.com/adong/sd-open-pr/tree/master',
        rootDir: ''
      },
      createTime: '2020-06-09T17:38:54.420Z',
      admins: {
        adong: true
      }
    },
    {
      id: 5083,
      name: 'adong/sd-open-pr-w-branch',
      scmUri: 'github.com:271157252:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-open-pr-w-branch',
        url: 'https://github.com/adong/sd-open-pr-w-branch/tree/master',
        rootDir: ''
      },
      createTime: '2020-06-18T19:20:20.228Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 29192
          },
          {
            name: '~pr:/.*/'
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: '~pr:/.*/',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      prChain: false
    },
    {
      id: 5401,
      name: 'adong/sd-paramters-dropdown',
      scmUri: 'github.com:283706564:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-paramters-dropdown',
        url: 'https://github.com/adong/sd-paramters-dropdown/tree/master',
        rootDir: ''
      },
      createTime: '2020-07-30T07:58:18.227Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 31413
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 539414,
      prChain: false,
      parameters: {
        resource: ['commands/publish', 'templates/mock', 'templates/tito'],
        from: 'latest',
        to: ['test', 'stable']
      }
    },
    {
      id: 5868,
      name: 'adong/sd-pipeline1',
      scmUri: 'github.com:299182270:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-pipeline1',
        url: 'https://github.com/adong/sd-pipeline1/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2020-09-28T04:01:38.841Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 34625
          },
          {
            name: 'sd@5869:dependentJob',
            id: 34627
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          },
          {
            src: 'main',
            dest: 'sd@5869:dependentJob'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 631630,
      prChain: false,
      parameters: {},
      settings: {
        metricsDowntimeJobs: [34625]
      }
    },
    {
      id: 5869,
      name: 'adong/sd-pipeline2',
      scmUri: 'github.com:299182600:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-pipeline2',
        url: 'https://github.com/adong/sd-pipeline2/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2020-09-28T04:01:46.165Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'dependentJob',
            id: 34627
          },
          {
            name: '~sd@5868:main',
            id: 34625
          }
        ],
        edges: [
          {
            src: '~sd@5868:main',
            dest: 'dependentJob'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'gq1'
      },
      lastEventId: 631631,
      prChain: false,
      parameters: {}
    },
    {
      id: 4648,
      name: 'adong/sd-test-secrets-environment',
      scmUri: 'github.com:254439961:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/sd-test-secrets-environment',
        url: 'https://github.com/adong/sd-test-secrets-environment/tree/master',
        rootDir: '',
        private: false
      },
      createTime: '2020-04-09T17:45:54.106Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 25991
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {
        'screwdriver.cd/buildCluster': 'bf1'
      },
      lastEventId: 629658,
      prChain: false,
      parameters: {}
    },
    {
      id: 3065,
      name: 'adong/toolbox',
      scmUri: 'github.com:202014154:master',
      scmContext: 'github:github.com',
      scmRepo: {
        branch: 'master',
        name: 'adong/toolbox',
        url: 'https://github.com/adong/toolbox/tree/master',
        rootDir: ''
      },
      createTime: '2019-08-12T21:49:03.269Z',
      admins: {
        adong: true
      },
      workflowGraph: {
        nodes: [
          {
            name: '~pr'
          },
          {
            name: '~commit'
          },
          {
            name: 'main',
            id: 16308
          }
        ],
        edges: [
          {
            src: '~pr',
            dest: 'main'
          },
          {
            src: '~commit',
            dest: 'main'
          }
        ]
      },
      annotations: {},
      prChain: false
    }
  ],
  actions: {
    toggleCollapse() {
      this.toggleProperty('collaspe');
    },

    async handleRowClick(pipeline) {
      console.log('handleRowClick row', pipeline);
      this.set('selectedPipeline', pipeline);
      this.onClick(pipeline);
    },

    async handleSubmit() {
      this.set('isLoading', true);

      try {
        const pipelines = await this.onSearch(this.pipelineName);

        if (pipelines && pipelines.length > 0) {
          this.setProperties({
            noResult: false,
            pipelines
          });
        } else {
          this.set('noResult', true);
        }
      } catch (e) {
      } finally {
        this.set('isLoading', false);
      }
    }
  }
});
