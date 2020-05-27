import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Pretender from 'pretender';
import Service from '@ember/service';

let server;

const sessionStub = Service.extend({
  data: {
    authenticated: {
      token: 'faketoken'
    }
  }
});

module('Unit | Service | cache', function(hooks) {
  setupTest(hooks);

  // Specify the other units that are required for this test.
  // needs: ['service:session'],

  hooks.beforeEach(function() {
    server = new Pretender();
    this.owner.register('service:session', sessionStub);
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it exists', function(assert) {
    const service = this.owner.lookup('service:cache');

    assert.ok(service);
  });

  test.only('it makes a call to delete pipeline cache successfully', function(assert) {
    server.delete('http://localhost:8080/v4/caches/pipelines/1', () => [204]);

    let service = this.owner.lookup('service:cache');

    assert.ok(service);

    const p = service.clearCache({ scope: 'pipelines', id: '1' });

    p.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'DELETE');
      assert.equal(request.url, 'http://localhost:8080/v4/caches/pipelines/1');
    });
  });

  test('it makes a call to delete job cache successfully', function(assert) {
    server.delete('http://localhost:8080/v4/caches/jobs/1', () => [204]);

    let service = this.owner.lookup('service:cache');

    assert.ok(service);

    const p = service.clearCache({ scope: 'jobs', id: '1' });

    p.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.status, '204');
      assert.equal(request.method, 'DELETE');
      assert.equal(request.url, 'http://localhost:8080/v4/caches/jobs/1');
    });
  });

  test('it returns 401 on unauthorized deletion', function(assert) {
    assert.expect(2);

    server.delete('http://localhost:8080/v4/caches/pipelines/1', () => [
      401,
      {
        'Content-Type': 'application/json'
      },
      'Unauthorized'
    ]);

    let service = this.owner.lookup('service:cache');

    assert.ok(service);

    const p = service.clearCache({ scope: 'pipelines', id: '1' });

    p.then(
      () => {},
      err => {
        assert.equal(err, 'You do not have the permissions to clear the cache.');
      }
    );
  });
});
