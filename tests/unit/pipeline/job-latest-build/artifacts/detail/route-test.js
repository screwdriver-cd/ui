import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';
import sinon from 'sinon';
import Service from '@ember/service';

module(
  'Unit | Route | pipeline/job-latest-build/artifacts/detail',
  function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/detail'
      );

      assert.ok(route);
    });

    test('it redirects to artifacts page', function (assert) {
      assert.expect(5);

      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/detail'
      );

      const paramStub = sinon
        .stub(route, 'paramsFor')
        .returns({ file_path: 123 });
      const model = {
        pipelineId: 1,
        id: 2
      };

      const routerServiceMock = Service.extend({
        transitionTo: (path, pipelineId, buildId, filePath) => {
          assert.equal(path, 'pipeline.build.artifacts.detail');
          assert.equal(pipelineId, 1);
          assert.equal(buildId, 2);
          assert.equal(filePath, 123);
        }
      });

      this.owner.unregister('service:router');
      this.owner.register('service:router', routerServiceMock);

      route.afterModel(model);

      assert.ok(paramStub.calledOnce, 'paramsFor was called once');
    });
  }
);
