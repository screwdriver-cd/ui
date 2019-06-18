const emptyMockCollections = [];

const mockCollections = [
  {
    id: 1,
    name: 'collection1',
    description: 'description1',
    userId: 1,
    pipelineIds: [12742, 12743]
  }
];

const mockCollection = [
  {
    id: 1,
    name: 'collection1',
    description: 'description1',
    pipelines: [
      {
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
      },
      {
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
      }
    ]
  }
];

export const hasCollections = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockCollections)
];

export const hasEmptyCollections = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(emptyMockCollections)
];

export const hasCollection = () => [
  200,
  { 'Content-Type': 'application/json' },
  JSON.stringify(mockCollection)
];

export default {
  hasCollections,
  hasEmptyCollections,
  hasCollection
};
