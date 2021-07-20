const pipeline = {
  id: '1',
  admins: {
    tkyi: true,
    minz1027: true,
    Filbird: true,
    pranavrc: true,
    DekusDenial: true,
    parthasl: true,
    jithin1987: true,
    catto: true,
    adong: true,
    klu909: true,
    pritamstyz4ever: true,
    jithine: true,
    vnugopal: true,
    kumada626: true,
    InderH: true,
    mchengat: true,
    ombharatiya: true
  },
  annotations: {
    'screwdriver.cd/buildCluster': 'bf1'
  },
  checkoutUrl: null,
  rootDir: null,
  autoKeysGeneration: false,
  scmContext: 'github:github.com',
  createTime: '2017-01-05T00:55:46.775Z',
  scmRepo: {
    branch: 'master',
    name: 'screwdriver-cd/screwdriver',
    url: 'https://github.com/screwdriver-cd/screwdriver/tree/master',
    rootDir: '',
    private: false
  },
  scmUri: 'github.com:59517730:master',
  name: 'screwdriver-cd/screwdriver',
  workflowGraph: {
    nodes: [
      {
        name: '~sd@73:publish',
        id: 389
      },
      {
        name: '~sd@9:publish',
        id: 34
      },
      {
        name: '~sd@1:beta',
        id: 3
      },
      {
        name: '~sd@1:main',
        id: 1
      },
      {
        name: '~sd@1:prod',
        id: 4
      },
      {
        name: '~sd@1:publish',
        id: 2
      },
      {
        name: '~sd@9:main',
        id: 33
      },
      {
        name: '~sd@73:main',
        id: 388
      }
    ],
    edges: [
      {
        src: '~sd@9:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@73:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@1:beta',
        dest: '~sd@1:prod'
      },
      {
        src: '~sd@1:main',
        dest: '~sd@1:publish'
      },
      {
        src: '~sd@1:publish',
        dest: '~sd@1:beta'
      },
      {
        src: '~sd@9:main',
        dest: '~sd@9:publish'
      },
      {
        src: '~sd@73:main',
        dest: '~sd@73:publish'
      }
    ]
  },
  configPipelineId: null,
  prChain: false,
  parameters: {}
};

const selectedConnectedPipeline = {
  admins: {
    tkyi: true,
    minz1027: true,
    Filbird: true,
    pranavrc: true,
    DekusDenial: true,
    parthasl: true,
    jithin1987: true,
    catto: true,
    adong: true,
    klu909: true,
    pritamstyz4ever: true,
    jithine: true,
    vnugopal: true,
    kumada626: true,
    InderH: true,
    mchengat: true,
    ombharatiya: true
  },
  annotations: {
    'screwdriver.cd/buildCluster': 'bf1'
  },
  checkoutUrl: null,
  rootDir: null,
  autoKeysGeneration: false,
  scmContext: 'github:github.com',
  createTime: '2017-01-05T00:55:46.775Z',
  scmRepo: {
    branch: 'master',
    name: 'screwdriver-cd/screwdriver',
    url: 'https://github.com/screwdriver-cd/screwdriver/tree/master',
    rootDir: '',
    private: false
  },
  scmUri: 'github.com:59517730:master',
  name: 'screwdriver-cd/screwdriver',
  workflowGraph: {
    nodes: [
      {
        name: '~sd@73:publish',
        id: 389
      },
      {
        name: '~sd@9:publish',
        id: 34
      },
      {
        name: '~sd@1:beta',
        id: 3
      },
      {
        name: '~sd@1:main',
        id: 1
      },
      {
        name: '~sd@1:prod',
        id: 4
      },
      {
        name: '~sd@1:publish',
        id: 2
      },
      {
        name: '~sd@9:main',
        id: 33
      },
      {
        name: '~sd@73:main',
        id: 388
      }
    ],
    edges: [
      {
        src: '~sd@9:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@73:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@1:beta',
        dest: '~sd@1:prod'
      },
      {
        src: '~sd@1:main',
        dest: '~sd@1:publish'
      },
      {
        src: '~sd@1:publish',
        dest: '~sd@1:beta'
      },
      {
        src: '~sd@9:main',
        dest: '~sd@9:publish'
      },
      {
        src: '~sd@73:main',
        dest: '~sd@73:publish'
      }
    ]
  },
  configPipelineId: null,
  prChain: false,
  parameters: {}
};

const selectedPipeline = {
  admins: {
    tkyi: true,
    minz1027: true,
    Filbird: true,
    pranavrc: true,
    DekusDenial: true,
    parthasl: true,
    jithin1987: true,
    catto: true,
    adong: true,
    klu909: true,
    pritamstyz4ever: true,
    jithine: true,
    vnugopal: true,
    kumada626: true,
    InderH: true,
    mchengat: true,
    ombharatiya: true
  },
  annotations: {
    'screwdriver.cd/buildCluster': 'bf1'
  },
  checkoutUrl: null,
  rootDir: null,
  autoKeysGeneration: false,
  scmContext: 'github:github.com',
  createTime: '2017-01-05T00:55:46.775Z',
  scmRepo: {
    branch: 'master',
    name: 'screwdriver-cd/screwdriver',
    url: 'https://github.com/screwdriver-cd/screwdriver/tree/master',
    rootDir: '',
    private: false
  },
  scmUri: 'github.com:59517730:master',
  name: 'screwdriver-cd/screwdriver',
  workflowGraph: {
    nodes: [
      {
        name: '~sd@73:publish',
        id: 389
      },
      {
        name: '~sd@9:publish',
        id: 34
      },
      {
        name: '~sd@1:beta',
        id: 3
      },
      {
        name: '~sd@1:main',
        id: 1
      },
      {
        name: '~sd@1:prod',
        id: 4
      },
      {
        name: '~sd@1:publish',
        id: 2
      },
      {
        name: '~sd@9:main',
        id: 33
      },
      {
        name: '~sd@73:main',
        id: 388
      }
    ],
    edges: [
      {
        src: '~sd@9:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@73:publish',
        dest: '~sd@1:main'
      },
      {
        src: '~sd@1:beta',
        dest: '~sd@1:prod'
      },
      {
        src: '~sd@1:main',
        dest: '~sd@1:publish'
      },
      {
        src: '~sd@1:publish',
        dest: '~sd@1:beta'
      },
      {
        src: '~sd@9:main',
        dest: '~sd@9:publish'
      },
      {
        src: '~sd@73:main',
        dest: '~sd@73:publish'
      }
    ]
  },
  configPipelineId: null,
  prChain: false,
  parameters: {}
};

const connectedPipelines = [
  {
    admins: {
      tkyi: true,
      minz1027: true,
      Filbird: true,
      pranavrc: true,
      DekusDenial: true,
      parthasl: true,
      jithin1987: true,
      catto: true,
      adong: true,
      klu909: true,
      pritamstyz4ever: true,
      jithine: true,
      vnugopal: true,
      kumada626: true,
      InderH: true,
      mchengat: true,
      ombharatiya: true
    },
    annotations: {
      'screwdriver.cd/buildCluster': 'bf1'
    },
    checkoutUrl: null,
    rootDir: null,
    autoKeysGeneration: false,
    scmContext: 'github:github.com',
    createTime: '2017-01-05T00:55:46.775Z',
    scmRepo: {
      branch: 'master',
      name: 'screwdriver-cd/screwdriver',
      url: 'https://github.com/screwdriver-cd/screwdriver/tree/master',
      rootDir: '',
      private: false
    },
    scmUri: 'github.com:59517730:master',
    name: 'screwdriver-cd/screwdriver',
    workflowGraph: {
      nodes: [
        {
          name: '~sd@73:publish',
          id: 389
        },
        {
          name: '~sd@9:publish',
          id: 34
        },
        {
          name: '~sd@1:beta',
          id: 3
        },
        {
          name: '~sd@1:main',
          id: 1
        },
        {
          name: '~sd@1:prod',
          id: 4
        },
        {
          name: '~sd@1:publish',
          id: 2
        },
        {
          name: '~sd@9:main',
          id: 33
        },
        {
          name: '~sd@73:main',
          id: 388
        }
      ],
      edges: [
        {
          src: '~sd@9:publish',
          dest: '~sd@1:main'
        },
        {
          src: '~sd@73:publish',
          dest: '~sd@1:main'
        },
        {
          src: '~sd@1:beta',
          dest: '~sd@1:prod'
        },
        {
          src: '~sd@1:main',
          dest: '~sd@1:publish'
        },
        {
          src: '~sd@1:publish',
          dest: '~sd@1:beta'
        },
        {
          src: '~sd@9:main',
          dest: '~sd@9:publish'
        },
        {
          src: '~sd@73:main',
          dest: '~sd@73:publish'
        }
      ]
    },
    configPipelineId: null,
    prChain: false,
    parameters: {}
  },
  {
    admins: {
      tkyi: true,
      d2lam: true,
      DekusDenial: true,
      jithin1987: true,
      catto: true,
      adong: true,
      klu909: true,
      pritamstyz4ever: true,
      parthasl: true,
      jithine: true,
      vnugopal: true,
      InderH: true,
      kumada626: true,
      ombharatiya: true
    },
    annotations: {
      'screwdriver.cd/buildCluster': 'bf1'
    },
    checkoutUrl: null,
    rootDir: null,
    autoKeysGeneration: false,
    scmContext: 'github:github.com',
    createTime: '2017-01-05T18:17:34.882Z',
    scmRepo: {
      branch: 'master',
      name: 'screwdriver-cd/models',
      url: 'https://github.com/screwdriver-cd/models/tree/master',
      rootDir: '',
      private: false
    },
    scmUri: 'github.com:62759755:master',
    name: 'screwdriver-cd/models',
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
          id: 33
        },
        {
          name: 'publish',
          id: 34
        },
        {
          name: 'sd@1:main',
          id: 1
        }
      ],
      edges: [
        {
          src: '~commit',
          dest: 'main'
        },
        {
          src: '~pr',
          dest: 'main'
        },
        {
          src: 'main',
          dest: 'publish'
        },
        {
          src: 'publish',
          dest: 'sd@1:main'
        }
      ]
    },
    configPipelineId: null,
    prChain: false,
    parameters: {}
  },
  {
    admins: {
      tkyi: true,
      klu909: true
    },
    annotations: {
      'screwdriver.cd/buildCluster': 'bf1'
    },
    checkoutUrl: null,
    rootDir: null,
    autoKeysGeneration: false,
    scmContext: 'github:github.com',
    createTime: '2017-02-16T01:36:00.831Z',
    scmRepo: {
      branch: 'master',
      name: 'screwdriver-cd/artifact-bookend',
      url: 'https://github.com/screwdriver-cd/artifact-bookend/tree/master',
      rootDir: '',
      private: false
    },
    scmUri: 'github.com:82125107:master',
    name: 'screwdriver-cd/artifact-bookend',
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
          id: 388
        },
        {
          name: 'publish',
          id: 389
        },
        {
          name: 'sd@1:main',
          id: 1
        },
        {
          name: 'sd@1711:main',
          id: 9933
        },
        {
          name: 'sd@3062:main',
          id: 16216
        },
        {
          name: 'sd@4226:main',
          id: 22809
        }
      ],
      edges: [
        {
          src: '~commit',
          dest: 'main'
        },
        {
          src: '~pr',
          dest: 'main'
        },
        {
          src: 'main',
          dest: 'publish'
        },
        {
          src: 'publish',
          dest: 'sd@1:main'
        },
        {
          src: 'publish',
          dest: 'sd@1711:main'
        },
        {
          src: 'publish',
          dest: 'sd@3062:main'
        },
        {
          src: 'publish',
          dest: 'sd@4226:main'
        }
      ]
    },
    configPipelineId: null,
    prChain: false,
    parameters: {}
  }
];

export { pipeline, selectedConnectedPipeline, selectedPipeline, connectedPipelines };
