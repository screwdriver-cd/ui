import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Controller | pipeline/options', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    server = new Pretender();
  });

  hooks.afterEach(function() {
    server.shutdown();
  });

  test('it handles updating job state', function(assert) {
    server.put('http://localhost:8080/v4/jobs/1234', () => [200, {}, JSON.stringify({ id: 1234 })]);

    let controller = this.owner.lookup('controller:pipeline/options');

    run(() => {
      controller.store.push({
        data: {
          id: '1234',
          type: 'job',
          attributes: {
            status: 'DISABLED'
          }
        }
      });

      controller.send('setJobStatus', '1234', 'ENABLED', 'tkyi', 'testing');
    });

    return settled().then(() => {
      const [request] = server.handledRequests;
      const payload = JSON.parse(request.requestBody);

      assert.equal(payload.state, 'ENABLED');
      assert.equal(payload.stateChanger, 'tkyi');
      assert.equal(payload.stateChangeMessage, 'testing');
    });
  });

  test('it handles deleting pipelines', function(assert) {
    assert.expect(2);
    server.delete('http://localhost:8080/v4/pipelines/abc1234', () => [
      200,
      {},
      '{"id": "abc1234"}'
    ]);

    let controller = this.owner.lookup('controller:pipeline/options');

    run(() => {
      controller.store.push({
        data: {
          id: 'abc1234',
          type: 'pipeline',
          attributes: {
            state: 'ENABLED'
          }
        }
      });
      controller.set('model', { pipeline: controller.store.peekRecord('pipeline', 'abc1234') });

      controller.transitionToRoute = route => {
        assert.equal(route, 'home');
      };

      controller.send('removePipeline');
    });

    return settled().then(() => {
      assert.ok(true);
    });
  });
});
