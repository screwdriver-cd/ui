import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Pretender from 'pretender';
let server;

const stop = () => {
  server.put('http://localhost:8080/v4/events/1/stop', () => [200]);
};

const stopFailed = () => {
  server.put('http://localhost:8080/v4/events/1/stop', () => [
    500,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })
  ]);
};

module('Unit | Service | event-stop', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:event-stop');

    assert.ok(service);
  });

  test('it makes a call to stop all builds in an event', function (assert) {
    assert.expect(1);
    stop();
    const service = this.owner.lookup('service:event-stop');
    const e = service.stopBuilds(1);

    e.then(() => {
      const [request] = server.handledRequests;

      assert.equal(request.url, 'http://localhost:8080/v4/events/1/stop');
    });
  });

  test('it fails to stop all builds in an event with error message ', function (assert) {
    assert.expect(2);
    stopFailed();
    const service = this.owner.lookup('service:event-stop');
    const e = service.stopBuilds(1);

    e.catch(error => {
      assert.equal(error, 'internal server error');
      const [request] = server.handledRequests;

      assert.equal(request.url, 'http://localhost:8080/v4/events/1/stop');
    });
  });
});
