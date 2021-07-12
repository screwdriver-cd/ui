import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

module('Unit | Route | pipeline/job-latest-build/index', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:pipeline/job-latest-build/index');

    assert.ok(route);
  });

  sinonTest('it redirects to builds page', function(assert) {
    assert.expect(2);

    const route = this.owner.lookup('route:pipeline/job-latest-build/index');
    const transitionStub = this.stub(route, 'transitionTo');
    const model = {
      pipelineId: 1,
      id: 2
    };

    route.afterModel(model);

    assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
    assert.ok(transitionStub.calledWithExactly('pipeline.build', 1, 2), 'transition to pipeline build');
  });
});
