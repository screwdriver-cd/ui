import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Pretender from 'pretender';
import Service from '@ember/service';
let server;

const manifest = `.
./test.txt
./coverage
./coverage/coverage.json`;

const buildId = 1;

const parsedManifest = [
  {
    text: 'coverage',
    type: 'directory',
    children: [
      {
        text: 'coverage.json',
        type: 'file',
        a_attr: {
          href: `http://localhost:8080/v4/builds/${buildId}/artifacts/coverage/coverage.json`
        }
      }
    ]
  },
  {
    text: 'test.txt',
    type: 'file',
    a_attr: {
      href: `http://localhost:8080/v4/builds/${buildId}/artifacts/test.txt`
    }
  }
];

const getManifest = () => {
  server.get(
    `http://localhost:8080/v4/builds/${buildId}/artifacts/manifest.txt`,
    () => [
      200,
      {
        'Content-Type': 'text/plain'
      },
      manifest
    ]
  );
};

const sessionServiceMock = Service.extend({
  isAuthenticated: false,
  data: {
    authenticated: {
      token: 'banana'
    }
  }
});

module('Unit | Service | build artifact', function (hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:session'],

  hooks.beforeEach(function () {
    server = new Pretender();
    this.owner.register('service:session', sessionServiceMock);
    this.session = this.owner.lookup('service:session');
    this.session.set('isAuthenticated', false);
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:build-artifact');

    assert.ok(service);
  });

  test('it rejects if the user is not authenticated', function (assert) {
    assert.expect(2);

    const service = this.owner.lookup('service:build-artifact');
    const p = service.fetchManifest(buildId);

    p.catch(e => {
      assert.ok(e instanceof Error, e);
      assert.equal('User is not authenticated', e.message);
    });
  });

  test('it makes a call to get artifact manifest successfully', function (assert) {
    assert.expect(2);
    this.session.set('isAuthenticated', true);
    getManifest();
    const service = this.owner.lookup('service:build-artifact');
    const p = service.fetchManifest(buildId);

    p.then(data => {
      const [request] = server.handledRequests;

      assert.equal(
        request.url,
        `http://localhost:8080/v4/builds/${buildId}/artifacts/manifest.txt?type=download`
      );
      assert.deepEqual(data, parsedManifest);
    });
  });

  test('it resolves to an empty list when the manifest is not found', async function (assert) {
    this.session.set('isAuthenticated', true);
    server.get(
      `http://localhost:8080/v4/builds/${buildId}/artifacts/manifest.txt`,
      () => [404, {}, '']
    );
    const service = this.owner.lookup('service:build-artifact');

    assert.deepEqual(await service.fetchManifest(buildId), []);
  });

  test('it rejects when the manifest request is forbidden', async function (assert) {
    assert.expect(1);
    this.session.set('isAuthenticated', true);
    server.get(
      `http://localhost:8080/v4/builds/${buildId}/artifacts/manifest.txt`,
      () => [403, {}, '']
    );
    const service = this.owner.lookup('service:build-artifact');

    try {
      await service.fetchManifest(buildId);
    } catch (e) {
      assert.equal(e.message, 'Failed to fetch artifacts: 403');
    }
  });
});
