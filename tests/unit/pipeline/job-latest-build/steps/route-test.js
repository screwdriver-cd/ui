import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';

module('Unit | Route | pipeline/job-latest-build/steps', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/job-latest-build/steps');

    assert.ok(route);
  });

  test('it redirects to build step page', function (assert) {
    assert.expect(3);

    const route = this.owner.lookup('route:pipeline/job-latest-build/steps');
    const transitionStub = sinon.stub(route, 'transitionTo');
    const paramStub = sinon
      .stub(route, 'paramsFor')
      .returns({ step_name: 123 });
    const model = {
      pipelineId: 1,
      id: 2
    };

    route.afterModel(model);

    assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
    assert.ok(paramStub.calledOnce, 'paramsFor was called once');
    assert.ok(
      transitionStub.calledWithExactly('pipeline.build.step', 1, 2, 123),
      'transition to build step'
    );
  });
});
