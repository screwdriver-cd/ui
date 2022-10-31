import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

module(
  'Unit | Route | pipeline/job-latest-build/artifacts/index',
  function (hooks) {
    setupTest(hooks);

    test('it exists', function (assert) {
      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/index'
      );

      assert.ok(route);
    });

    test('it redirects to artifacts page', function (assert) {
      assert.expect(3);

      const route = this.owner.lookup(
        'route:pipeline/job-latest-build/artifacts/index'
      );
      const model = {
        pipelineId: 1,
        id: 2
      };

      const routerServiceMock = Service.extend({
        transitionTo: (path, pipelineId, buildId) => {
          assert.equal(path, 'pipeline.build.artifacts.index');
          assert.equal(pipelineId, 1);
          assert.equal(buildId, 2);
        }
      });

      this.owner.unregister('service:router');
      this.owner.register('service:router', routerServiceMock);

      route.afterModel(model);
    });
  }
);
