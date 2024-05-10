import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Pretender from 'pretender';
let server;

const getTriggers = () => {
  server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
    200,
    {
      'Content-Type': 'application/json'
    },
    JSON.stringify([
      {
        jobName: 'main',
        triggers: ['~sd@2:main', '~sd@3:deploy']
      },
      {
        jobName: 'prod',
        triggers: ['~sd@4:main']
      }
    ])
  ]);
};

const getTriggersFailed = () => {
  server.get('http://localhost:8080/v4/pipelines/1/triggers', () => [
    500,
    { 'Content-Type': 'application/json' },
    JSON.stringify({
      statusCode: 500,
      message: 'internal server error'
    })
  ]);
};

module('Unit | Service | pipeline triggers', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it exists', function (assert) {
    const service = this.owner.lookup('service:pipeline-triggers');

    assert.ok(service);
  });

  test('it makes a call to get all pipeline triggers', function (assert) {
    assert.expect(1);
    getTriggers();
    const service = this.owner.lookup('service:pipeline-triggers');
    const p = service.getDownstreamTriggers(1);

    p.then(() => {
      const [request] = server.handledRequests;

      assert.equal(
        request.url,
        'http://localhost:8080/v4/pipelines/1/triggers'
      );
    });
  });

  test('it fails to get pipeline triggers with error message ', function (assert) {
    assert.expect(2);
    getTriggersFailed();
    const service = this.owner.lookup('service:pipeline-triggers');
    const p = service.getDownstreamTriggers(1);

    p.catch(error => {
      assert.equal(error, '500 internal server error');
      const [request] = server.handledRequests;

      assert.equal(
        request.url,
        'http://localhost:8080/v4/pipelines/1/triggers'
      );
    });
  });
});
