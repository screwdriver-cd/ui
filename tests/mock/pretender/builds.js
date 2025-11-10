/* eslint-disable require-jsdoc,import/prefer-default-export */

export function buildRoutes(mockApi) {
  mockApi.get('/builds', () => [200, []]);

  mockApi.get('/builds/statuses', () => {
    return [
      200,
      [
        {
          jobId: 1,
          builds: [
            {
              id: 12345,
              jobId: 1,
              status: 'SUCCESS',
              startTime: null,
              endTime: null
            }
          ]
        }
      ]
    ];
  });
}
