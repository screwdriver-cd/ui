import EmberObject from '@ember/object';
import Service from '@ember/service';
import { Promise as EmberPromise } from 'rsvp';
import { module, test } from 'qunit';
import { setupTest } from 'screwdriver-ui/tests/helpers';

module('Unit | Route | builds', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:builds');

    assert.ok(route);
  });

  test('it redirects', function (assert) {
    assert.expect(3);
    const route = this.owner.lookup('route:builds');

    const model = {
      pipeline: { id: 1 },
      build: { id: 2 }
    };

    const routerServiceMock = Service.extend({
      transitionTo: (path, pipelineId, buildId) => {
        assert.equal(path, 'pipeline.build');
        assert.equal(pipelineId, 1);
        assert.equal(buildId, 2);
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    route.redirect(model);
  });

  test('it fetches pipeline & build', function (assert) {
    const dataMapping = {
      build_2: { type: 'build', jobId: 'jid', id: 2 },
      job_jid: { type: 'job', id: 'jid', pipelineId: 1 },
      pipeline_1: { type: 'job', id: 1 }
    };

    const storeStub = Service.extend({
      findRecord(type, id) {
        return new EmberPromise(resolve =>
          resolve(EmberObject.create(dataMapping[`${type}_${id}`]))
        );
      }
    });

    this.owner.unregister('service:store');
    this.owner.register('service:store', storeStub);

    const route = this.owner.lookup('route:builds');

    return route.model({ build_id: 2 }).then(data => {
      const { build, pipeline } = data;

      assert.equal(pipeline.id, 1);
      assert.equal(build.id, 2);
    });
  });
});
