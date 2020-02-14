import EmberObject from '@ember/object';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import sinonTest from 'ember-sinon-qunit/test-support/test';
import { getActiveStep } from 'screwdriver-ui/utils/build';

module('Unit | Route | pipeline/build', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const route = this.owner.lookup('route:pipeline/build');

    assert.ok(route);
    assert.equal(
      route.titleToken({
        job: EmberObject.create({ name: 'main' }),
        build: EmberObject.create({ sha: 'abcd1234567890', truncatedSha: 'abcd123' })
      }),
      'main > #abcd123'
    );
  });

  sinonTest('it redirects if build not found', function(assert) {
    const route = this.owner.lookup('route:pipeline/build');
    const stub = this.stub(route, 'transitionTo');
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

    route.afterModel(model);

    assert.ok(stub.calledOnce, 'transitionTo was called once');
    assert.ok(stub.calledWithExactly('pipeline', pipelineId), 'transition to pipeline');
  });

  sinonTest('it redirects if not step route', function(assert) {
    const route = this.owner.lookup('route:pipeline/build');
    const stub = this.stub(route, 'transitionTo');

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
      }
    };

    route.redirect(model, transition);

    model.build.steps = [{ startTime: 's', endTime: 'e', name: 'error', code: 1 }];

    route.redirect(model, transition);

    assert.ok(stub.calledOnce, 'transitionTo was called once');
    assert.ok(
      stub.calledWithExactly('pipeline.build.step', pipelineId, buildId, 'error'),
      'transition to build step page'
    );
  });

  sinonTest('it redirects will NOT redirect if on artifacts route', function(assert) {
    assert.expect(2);
    const route = this.owner.lookup('route:pipeline/build');
    const spy = this.spy(getActiveStep);
    const buildId = 345;
    const pipelineId = 123;
    const model = {
      pipeline: {
        get: type => (type === 'id' ? pipelineId : null)
      },
      build: {
        get: type => (type === 'id' ? buildId : null),
        steps: []
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
