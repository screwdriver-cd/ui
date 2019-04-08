import { moduleFor, test } from 'ember-qunit';
import EmberObject from '@ember/object';
import sinonTest from 'ember-sinon-qunit/test-support/test';

moduleFor('route:pipeline/build/step', 'Unit | Route | pipeline/build/step', {
  needs: ['controller:pipeline.build', 'service:session', 'service:pr-events']
});

test('it exists', function (assert) {
  assert.ok(this.subject());
});

sinonTest('it redirects if step is not found in build', function (assert) {
  const route = this.subject();
  const stub = this.stub(route, 'transitionTo');
  const model = {
    event: EmberObject.create(),
    pipeline: EmberObject.create({ id: 1 }),
    job: EmberObject.create({ pipelineId: 1 }),
    build: EmberObject.create({ id: 2, steps: [{ name: 'test' }] })
  };

  route.afterModel(model);

  assert.ok(stub.calledOnce, 'transitionTo was called once');
  assert.ok(stub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline');
});
