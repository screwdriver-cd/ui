// import EmberObject from '@ember/object';
import { resolve } from 'rsvp';
import Service from '@ember/service';
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
    '[]'
  ]);
};

const mockBannerService = Service.extend({
  fetchBanners() {
    return resolve({
      banners: [
        { id: 1, isActive: true, message: actualMessage }
      ],
      done: true
    });
  }
});

moduleFor('service:nav-banner', 'Integration | Component | nav banner', {
  integration: true,

  beforeEach() {
    server = new Pretender();
    this.register('service:nav-banner', mockBannerService);
  },

  afterEach() {
    server.shutdown();
  }
});

test('it fetches active banners', function (assert) {
  getBanners();
  const service = this.subject();
  const b = service.fetchBanners();

  b.then(({ banners, done }) => {
    assert.ok(done);
    assert.equal(banners[0].message, actualMessage);
  });
});
