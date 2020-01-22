import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';

module('Unit | Route | pipeline/job-latest-build/artifacts/detail', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    let route = this.owner.lookup('route:pipeline/job-latest-build/artifacts/detail');

    assert.ok(route);
  });

  sinonTest('it redirects to artifacts page', function(assert) {
    assert.expect(3);

    const route = this.owner.lookup('route:pipeline/job-latest-build/artifacts/detail');
    const transitionStub = this.stub(route, 'transitionTo');
    const paramStub = this.stub(route, 'paramsFor').returns({ file_path: 123 });
    const model = {
      pipelineId: 1,
      id: 2
    };

    route.afterModel(model);

    assert.ok(transitionStub.calledOnce, 'transitionTo was called once');
    assert.ok(paramStub.calledOnce, 'paramsFor was called once');
    assert.ok(
      transitionStub.calledWithExactly('pipeline.build.artifacts.detail', 1, 2, 123),
      'transition to build artifacts detail'
    );
  });
});
