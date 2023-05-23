import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import Service from '@ember/service';
import { getActiveStep } from 'screwdriver-ui/utils/build';

module('Unit | Route | pipeline/build', function (hooks) {
  setupTest(hooks);

  test('it exists', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');

    assert.ok(route);
  });

  test('it redirects if build not found', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');
    const jobId = 345;
    const pipelineId = 123;
    const model = {
      pipeline: {
        get: type => (type === 'id' ? pipelineId : null)
      },
      job: {
        get: type => (type === 'id' ? jobId : null)
      }
    };

    const routerServiceMock = Service.extend({
      transitionTo: (path, id) => {
        assert.equal(path, 'pipeline');
        assert.equal(id, pipelineId);
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    route.redirect(model);
  });

  test('it redirects if not step route', function (assert) {
    const route = this.owner.lookup('route:pipeline/build');

    const buildId = 345;
    const pipelineId = 123;

    const transition = { targetName: 'pipeline.build.index' };

    const model = {
      pipeline: {
        get: type => (type === 'id' ? pipelineId : null)
      },
      build: {
        get: type => (type === 'id' ? buildId : null),
        steps: []
      },
      job: {
        get: type => (type === 'pipelineId' ? pipelineId : null)
      },
      event: {
        isPaused: true
      }
    };

    const routerServiceMock = Service.extend({
      transitionTo: (path, pipelineIdMock, buildIdMock, name) => {
        assert.equal(path, 'pipeline.build.step');
        assert.equal(pipelineIdMock, pipelineId);
        assert.equal(buildIdMock, buildId);
        assert.equal(name, 'error');
      }
    });

    this.owner.unregister('service:router');
    this.owner.register('service:router', routerServiceMock);

    route.redirect(model, transition);

    model.build.steps = [
      { startTime: 's', endTime: 'e', name: 'error', code: 1 }
    ];

    route.redirect(model, transition);
  });

  test('it redirects will NOT redirect if on artifacts route', function (assert) {
    assert.expect(2);
    const route = this.owner.lookup('route:pipeline/build');
    const spy = sinon.spy(getActiveStep);
    const buildId = 345;
    const pipelineId = 123;
    const model = {
      pipeline: {
        get: type => (type === 'id' ? pipelineId : null)
      },
      build: {
        get: type => (type === 'id' ? buildId : null),
        steps: []
      },
      job: {
        get: type => (type === 'pipelineId' ? pipelineId : null)
      },
      event: {
        isPaused: true
      }
    };

    let transition = { targetName: 'pipeline.build.artifacts.details' };

    route.redirect(model, transition);
    assert.ok(spy.notCalled, 'redirect was not called');

    transition = { targetName: 'pipeline.build.artifacts.index' };

    route.redirect(model, transition);
    assert.ok(spy.notCalled, 'redirect was not called');
  });
});
