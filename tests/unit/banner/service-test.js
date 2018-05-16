import Pretender from 'pretender';
import { moduleFor, test } from 'ember-qunit';
const actualMessage = 'shutdown imminent';
let server;

const getBanners = () => {
  server.get('http://localhost:8080/v4/banners', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      { id: 1, isActive: true, message: actualMessage }
    ])
  ]);
};

moduleFor('service:banner', 'Unit | Service | banner', {
  integration: true,

  beforeEach() {
    server = new Pretender();
    // this.register('service:nav-banner', mockBannerService);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it exists', function (assert) {
  const service = this.subject();

  assert.ok(service);
});

test('it fetches active banners', function (assert) {
  assert.expect(1);
  getBanners();
  const service = this.subject();
  const b = service.fetchBanners();

  b.then((banners) => {
    assert.equal(banners[0].message, actualMessage);
  });
});
