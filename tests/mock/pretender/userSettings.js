/* eslint-disable require-jsdoc, import/prefer-default-export */

export function userSettingRoute(mockApi) {
  mockApi.get('/users/settings', () => {
    return [200, {}];
  });

  mockApi.put('/users/settings', () => {
    return [200, {}];
  });
}
