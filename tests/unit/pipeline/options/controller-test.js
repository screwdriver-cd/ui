import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import { waitUntil } from '@ember/test-helpers';
import Pretender from 'pretender';
import sinon from 'sinon';
let server;

module('Unit | Controller | pipeline/options', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    server = new Pretender();
  });

  hooks.afterEach(function () {
    server.shutdown();
  });

  test('it handles deleting pipelines', async function (assert) {
    assert.expect(1);
    server.delete('http://localhost:8080/v4/pipelines/abc1234', () => [
      200,
      {},
      '{"id": "abc1234"}'
    ]);

    const controller = this.owner.lookup('controller:pipeline/options');

    this.owner.unregister('service:store');
    this.owner.lookup('service:store').push({
      data: {
        id: 'abc1234',
        type: 'pipeline',
        attributes: {
          state: 'ENABLED'
        }
      }
    });

    const routerService = this.owner.lookup('service:router');
    const transitionToStub = sinon.stub(routerService, 'transitionTo');

    run(async () => {
      controller.set('model', {
        pipeline: await this.owner
          .lookup('service:store')
          .peekRecord('pipeline', 'abc1234')
      });

      controller.send('removePipeline');
    });

    await waitUntil(() => transitionToStub.called);

    assert.ok(transitionToStub.calledWith('home'));
  });
});
