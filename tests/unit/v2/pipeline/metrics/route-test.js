import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';

module('Unit | Route | v2/pipeline/metrics', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    let route = this.owner.lookup('route:v2/pipeline/metrics');

    assert.ok(route);
  });

  test('it redirects to pipeline.metrics with the correct id', function (assert) {
    let route = this.owner.lookup('route:v2/pipeline/metrics');

    let routerService = this.owner.lookup('service:router');

    let transitionStub = sinon.stub(routerService, 'transitionTo');

    let transition = {
      to: {
        parent: {
          params: {
            pipeline_id: '123'
          }
        }
      }
    };

    route.beforeModel(transition);
    assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
    assert.ok(
      transitionStub.calledWith('pipeline.metrics', '123'),
      'transitionTo was called with the correct arguments'
    );
    transitionStub.restore();
  });
});
