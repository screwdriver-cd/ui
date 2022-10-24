import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import Pretender from 'pretender';
let server;

module('Unit | Controller | pipeline/options', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it handles deleting pipelines', function (assert) {
    assert.expect(2);
    server.delete('http://localhost:8080/v4/pipelines/abc1234', () => [
      200,
      {},
      '{"id": "abc1234"}'
    ]);

    const controller = this.owner.lookup('controller:pipeline/options');

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
      controller.set('model', {
        pipeline: controller.store.peekRecord('pipeline', 'abc1234')
      });

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
