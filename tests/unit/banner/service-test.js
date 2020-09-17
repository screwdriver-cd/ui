import Pretender from 'pretender';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
const actualMessage = 'shutdown imminent';

let server;

const getBanners = () => {
  server.get('http://localhost:8080/v4/banners', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([{ id: 1, isActive: true, message: actualMessage }])
  ]);
};

module('Unit | Service | banner', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it exists', function(assert) {
    const service = this.owner.lookup('service:banner');

    assert.ok(service);
  });

  test('it fetches active banners', function(assert) {
    assert.expect(1);
    getBanners();
    const service = this.owner.lookup('service:banner');
    const b = service.fetchBanners();

    b.then(banners => {
      assert.equal(banners[0].message, actualMessage);
    });
  });
});
