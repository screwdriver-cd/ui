import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';
import sinon from 'sinon';

module('Unit | Route | pipeline/build/step', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    assert.ok(this.owner.lookup('route:pipeline/build/step'));
  });

  test('it redirects if step is not found in build', function (assert) {
    const route = this.owner.lookup('route:pipeline/build/step');
    const stub = sinon.stub(route, 'transitionTo');
    const model = {
      event: EmberObject.create(),
      pipeline: EmberObject.create({ id: 1 }),
      job: EmberObject.create({ pipelineId: 1 }),
      build: EmberObject.create({ id: 2, steps: [{ name: 'test' }] })
    };

    route.afterModel(model);

    assert.ok(stub.calledOnce, 'transitionTo was called once');
    assert.ok(
      stub.calledWithExactly('pipeline.build', 1, 2),
      'transition to pipeline'
    );
  });
});
