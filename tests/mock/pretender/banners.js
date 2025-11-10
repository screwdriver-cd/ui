/* eslint-disable require-jsdoc,import/prefer-default-export */

export function noBanners(mockApi) {
  mockApi.get('/banners', () => {
    return [200, []];
  });
}
