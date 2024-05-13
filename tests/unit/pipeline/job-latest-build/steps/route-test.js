import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import Service from '@ember/service';
import sinon from 'sinon';

module('Unit | Route | pipeline/job-latest-build/steps', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/job-latest-build/steps');

    assert.ok(route);
  });

  test('it redirects to build step page', function (assert) {
    assert.expect(5);

    const route = this.owner.lookup('route:pipeline/job-latest-build/steps');
    const paramStub = sinon
      .stub(route, 'paramsFor')
      .returns({ step_name: 123 });
    const model = {
      pipelineId: 1,
      id: 2
    };

    const routerServiceMock = Service.extend({
      transitionTo: (path, pipelineId, buildId, stepName) => {
        assert.equal(path, 'pipeline.build.step');
        assert.equal(pipelineId, 1);
        assert.equal(buildId, 2);
        assert.equal(stepName, 123);
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    route.afterModel(model);

    assert.ok(paramStub.calledOnce, 'paramsFor was called once');
  });
});
