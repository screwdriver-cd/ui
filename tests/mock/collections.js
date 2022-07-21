import EmberObject from '@ember/object';

const mockCollections = [
  EmberObject.create({
    id: 2,
    name: 'collection1',
    description: 'description1',
    type: 'normal',
    userId: 1,
    pipelineIds: [12742, 12743]
  }),
  EmberObject.create({
    id: 1,
    name: 'My Pipelines',
    description: 'default collection description',
    type: 'default',
    userId: 1,
    pipelineIds: [12742, 12743]
  })
];

const mockDefaultCollection = {
  id: 1,
  name: 'My Pipelines',
  description: 'default collection description',
  type: 'default',
  pipelineIds: [12742, 12743],
  pipelines: [
    EmberObject.create({
      id: 12742,
      scmUri: 'github.com:12345678:master',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main', 'publish'],
      scmRepo: {
        name: 'screwdriver-cd/screwdriver',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/screwdriver/tree/master'
      },
      scmContext: 'github:github.com',
      annotations: {},
      lastEventId: 12,
      lastBuilds: [
        {
          id: 123,
          status: 'SUCCESS'
        },
        {
          id: 124,
          status: 'FAILURE'
        }
      ]
    }),
    EmberObject.create({
      id: 12743,
      scmUri: 'github.com:87654321:master',
      createTime: '2017-01-05T00:55:46.775Z',
      admins: {
        username: true
      },
      workflow: ['main', 'publish'],
      scmRepo: {
        name: 'screwdriver-cd/ui',
        branch: 'master',
        url: 'https://github.com/screwdriver-cd/ui/tree/master'
      },
      scmContext: 'github:github.com',
      annotations: {},
      prs: {
        open: 2,
        failing: 1
      }
    })
  ]
};

const mockCollection = {
  ...mockDefaultCollection,
  id: 2,
  name: 'collection1',
  description: 'description1',
  type: 'normal'
};

const mockEmptyDefaultCollection = {
  ...mockDefaultCollection,
  pipelineIds: [],
  pipelines: []
};

const mockEmptyCollection = {
  ...mockCollection,
  pipelineIds: [],
  pipelines: []
};

export const hasCollections = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockCollections)
];

export const hasDefaultCollection = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockDefaultCollection)
];

export const hasCollection = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockCollection)
];

export const hasEmptyDefaultCollection = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockEmptyDefaultCollection)
];

export const hasEmptyCollection = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockEmptyCollection)
];

export default {
  hasCollections,
  hasDefaultCollection,
  hasCollection,
  hasEmptyDefaultCollection,
  hasEmptyCollection
};
