import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';
import Service from '@ember/service';

module('Unit | Route | pipeline/build/step', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    assert.ok(this.owner.lookup('route:pipeline/build/step'));
  });

  test('it redirects if step is not found in build', function (assert) {
    const route = this.owner.lookup('route:pipeline/build/step');
    const routerServiceMock = Service.extend({
      transitionTo: (path, pipelineId, buildId) => {
        assert.equal(path, 'pipeline.build');
        assert.equal(pipelineId, 1);
        assert.equal(buildId, 2);
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    const model = {
      event: EmberObject.create(),
      pipeline: EmberObject.create({ id: 1 }),
      job: EmberObject.create({ pipelineId: 1 }),
      build: EmberObject.create({ id: 2, steps: [{ name: 'test' }] })
    };

    route.afterModel(model);
  });
});
